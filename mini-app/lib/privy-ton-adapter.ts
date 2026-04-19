import { Address, beginCell, Cell, TonClient, WalletContractV4 } from '@ton/ton';

type Wallet = {
  account: {
    address: string;
    chain: number;
    walletStateInit: string;
  };
  device: {
    appName: string;
    appVersion: string;
    maxProtocolVersion: number;
    features: { name: string; maxMessages?: number }[];
    platform: string;
  };
  provider: 'http' | 'injected';
};

type SendTransactionRequest = {
  validUntil: number;
  network?: number;
  from?: string;
  messages: {
    address: string;
    amount: string;
    stateInit?: string;
    payload?: string;
  }[];
};

type SendTransactionResponse = { boc: string };

type SignCallback = (data: string) => Promise<Buffer>;

export class PrivyTonConnectAdapter {
  private _wallet: Wallet | null = null;
  private _listeners: Array<(wallet: Wallet | null) => void> = [];
  private _errorListeners: Array<(err: Error) => void> = [];
  private _address: Address | null = null;
  private _publicKey: Buffer | null = null;
  private _client: TonClient;
  private _signCallback: SignCallback | null = null;

  constructor() {
    this._client = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    });
  }

  async connect(address: string, publicKey: string, signCallback: SignCallback) {
    if (!address) {
      throw new Error('Address is required');
    }
    if (!publicKey) {
      throw new Error('PublicKey is required');
    }

    // Address.parse for user-friendly format (EQ:...), Address.parseRaw for raw format (0:...)
    this._address = Address.parse(address);
    this._publicKey = Buffer.from(publicKey, 'hex');
    this._signCallback = signCallback;

    this._wallet = {
      account: {
        address: `0:${this._address.hash.toString('hex')}`,
        chain: -239,
        walletStateInit: '',
      },
      device: {
        appName: 'Privy',
        appVersion: '1.0',
        maxProtocolVersion: 2,
        features: [{ name: 'SendTransaction', maxMessages: 4 }],
        platform: 'browser',
      },
      provider: 'injected',
    };
    this._notifyListeners();
  }

  get wallet(): Wallet | null {
    return this._wallet;
  }

  get connectionRestored(): Promise<boolean> {
    return Promise.resolve(!!this._wallet);
  }

  get modal() {
    return {
      open: () => {},
      close: () => {},
      onStateChange: () => () => {},
      state: { status: 'closed', closeReason: null },
    };
  }

  onStatusChange(
    callback: (wallet: Wallet | null) => void,
    errorHandler?: (err: Error) => void
  ): () => void {
    this._listeners.push(callback);
    if (errorHandler) this._errorListeners.push(errorHandler);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== callback);
      if (errorHandler)
        this._errorListeners = this._errorListeners.filter((l) => l !== errorHandler);
    };
  }

  async disconnect(): Promise<void> {
    this._wallet = null;
    this._address = null;
    this._publicKey = null;
    this._signCallback = null;
    this._notifyListeners();
  }

  async sendTransaction(txReq: SendTransactionRequest): Promise<SendTransactionResponse> {
    if (!this._address || !this._publicKey || !this._signCallback) {
      throw new Error('Wallet not connected');
    }

    const walletContract = WalletContractV4.create({
      workchain: 0,
      publicKey: this._publicKey,
    });

    const seqno = await this._client
      .runMethodWithError(this._address, 'seqno')
      .then((r) => r.stack.readNumber())
      .catch(() => BigInt(0));

    const outMessages = txReq.messages.map((msg) => {
      const body = msg.payload ? Cell.fromBase64(msg.payload) : undefined;
      return beginCell()
        .storeUint(0, 2)
        .storeAddress(Address.parse(msg.address))
        .storeCoins(BigInt(msg.amount))
        .storeMaybeRef(body)
        .storeBit(false)
        .endCell();
    });

    const transfers = beginCell().storeUint(0, 32).storeUint(0, 64);
    for (const msg of outMessages) {
      transfers.storeBit(true).storeRef(msg);
    }
    transfers.storeBit(false);

    const signingMessage = beginCell()
      .storeUint(txReq.validUntil, 32)
      .storeUint(0, 32)
      .storeRef(transfers.endCell())
      .endCell();

    const signingHash = signingMessage.hash();

    const signature = await this._signCallback(signingHash.toString('hex'));

    const message = beginCell()
      .storeBuffer(signature)
      .storeRef(signingMessage)
      .endCell();

    const external = beginCell()
      .storeUint(0x82, 2)
      .storeRef(walletContract.init.code)
      .storeRef(walletContract.init.data)
      .storeRef(message)
      .endCell();

    const boc = external.toBoc();
    await this._client.sendFile(boc);

    return { boc: Buffer.from(boc).toString('base64') };
  }

  private _notifyListeners() {
    for (const l of this._listeners) {
      try {
        l(this._wallet);
      } catch (_) {}
    }
  }
}

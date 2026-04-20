import {
  Address,
  beginCell,
  Cell,
  TonClient,
  WalletContractV4,
  internal,
  external,
  storeMessageRelaxed,
  storeMessage,
} from '@ton/ton';

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
    if (!address) throw new Error('Address is required');
    if (!publicKey) throw new Error('PublicKey is required');

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

    // seqno をオンチェーンから取得
    const contract = this._client.open(walletContract);
    const seqno = await contract.getSeqno();

    // WalletV4 のメッセージボディを正しく構築（署名前）
    const bodyBuilder = beginCell()
      .storeUint(walletContract.walletId, 32)  // subWalletId (698983191)
      .storeUint(txReq.validUntil, 32)          // validUntil
      .storeUint(seqno, 32)                     // seqno（取得した実際の値）
      .storeUint(0, 8);                         // opCode = 0 (simple order)

    for (const msg of txReq.messages) {
      const internalMsg = internal({
        to: Address.parse(msg.address),
        value: BigInt(msg.amount),
        body: msg.payload ? Cell.fromBase64(msg.payload) : undefined,
        init: msg.stateInit
          ? { code: Cell.fromBase64(msg.stateInit), data: undefined }
          : undefined,
        bounce: true,
      });
      bodyBuilder.storeUint(3, 8); // SendMode: PAY_GAS_SEPARATELY | IGNORE_ERRORS
      bodyBuilder.storeRef(
        beginCell().store(storeMessageRelaxed(internalMsg)).endCell()
      );
    }

    const bodyCell = bodyBuilder.endCell();

    // Privy で署名（bodyCell のハッシュを渡す）
    const signature = await this._signCallback(bodyCell.hash().toString('hex'));

    // 署名 + ボディを結合した署名済みセル
    const signedCell = beginCell()
      .storeBuffer(signature)
      .storeSlice(bodyCell.asSlice())
      .endCell();

    // external メッセージを構築
    const externalMsg = external({
      to: this._address,
      init: seqno === 0 ? walletContract.init : undefined,
      body: signedCell,
    });

    const externalCell = beginCell()
      .store(storeMessage(externalMsg))
      .endCell();

    const boc = externalCell.toBoc();
    await this._client.sendFile(boc);

    return { boc: boc.toString('base64') };
  }

  private _notifyListeners() {
    for (const l of this._listeners) {
      try { l(this._wallet); } catch (_) {}
    }
  }
}

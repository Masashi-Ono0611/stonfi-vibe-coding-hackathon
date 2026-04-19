import { Address, beginCell, Cell, TonClient, WalletContractV4 } from '@ton/ton';
import { useTonWallet } from '@tonconnect/ui-react';
import type { IChain } from '@ton/ton';
import type { WalletInfoWithOpenMethod } from '@tonconnect/ui-react';

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

export class TonConnectAdapter {
  private _wallet: WalletInfoWithOpenMethod | null = null;
  private _listeners: Array<(wallet: Wallet | null) => void> = [];
  private _errorListeners: Array<(err: Error) => void> = [];
  private _address: Address | null = null;
  private _publicKey: Buffer | null = null;
  private _client: TonClient;

  constructor() {
    this._client = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    });
  }

  async connect(walletInfo: WalletInfoWithOpenMethod) {
    if (!walletInfo.account.address) {
      throw new Error('Address is required');
    }

    this._wallet = walletInfo;

    // For TON Connect, we don't have direct access to public key
    // We'll use the wallet's sendTransaction method directly
    this._address = Address.parse(walletInfo.account.address);

    this._wallet = {
      account: {
        address: `0:${this._address.hash.toString('hex')}`,
        chain: -1,
        walletStateInit: '',
      },
      device: {
        appName: 'TON Connect',
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
      state: { status: 'closed' as const, closeReason: null },
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
    this._notifyListeners();
  }

  async sendTransaction(txReq: SendTransactionRequest): Promise<SendTransactionResponse> {
    if (!this._wallet) {
      throw new Error('Wallet not connected');
    }

    // Use TON Connect's sendTransaction method
    if (!this._wallet.sendTransaction) {
      throw new Error('sendTransaction not available on wallet');
    }

    try {
      // Convert the transaction request to TON Connect format
      const messages = txReq.messages.map((msg) => ({
        address: msg.address,
        amount: msg.amount,
        payload: msg.payload ? Cell.fromBase64(msg.payload).toBoc().toString('base64') : '',
      }));

      const result = await this._wallet.sendTransaction({
        validUntil: txReq.validUntil,
        network: txReq.network || -1,
        from: txReq.from,
        messages,
      });

      // Return the BOC
      return { boc: result };
    } catch (error) {
      console.error('TON Connect transaction failed:', error);
      throw error;
    }
  }

  private _notifyListeners() {
    for (const l of this._listeners) {
      try {
        l(this._wallet);
      } catch (_) {}
    }
  }
}

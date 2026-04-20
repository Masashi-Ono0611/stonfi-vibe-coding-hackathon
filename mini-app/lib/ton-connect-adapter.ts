import { Cell } from '@ton/ton';
import type { TonConnectUI } from '@tonconnect/ui-react';

type ConnectedWallet = {
  account: {
    address: string;
    chain: number | string;
    walletStateInit?: string;
  };
};

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
  private _tonConnectUI: TonConnectUI | null = null;
  private _wallet: ConnectedWallet | null = null;
  private _listeners: Array<(wallet: Wallet | null) => void> = [];
  private _errorListeners: Array<(err: Error) => void> = [];

  async connect(tonConnectUI: TonConnectUI, walletInfo: ConnectedWallet) {
    this._tonConnectUI = tonConnectUI;
    this._wallet = walletInfo;
    this._notifyListeners();
  }

  get wallet(): Wallet | null {
    if (!this._wallet) return null;

    return {
      account: {
        address: this._wallet.account.address,
        chain: Number(this._wallet.account.chain) || -1,
        walletStateInit: '',
      },
      device: {
        appName: 'TON Connect',
        appVersion: '1.0',
        maxProtocolVersion: 2,
        features: [{ name: 'SendTransaction', maxMessages: 4 }],
        platform: 'browser',
      },
      provider: 'http',
    };
  }

  get connectionRestored(): Promise<boolean> {
    return Promise.resolve(this._wallet !== null);
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
    this._notifyListeners();
  }

  async sendTransaction(txReq: SendTransactionRequest): Promise<SendTransactionResponse> {
    if (!this._tonConnectUI || !this._wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const messages = txReq.messages.map((msg) => ({
        address: msg.address,
        amount: msg.amount,
        payload: msg.payload ? Cell.fromBase64(msg.payload).toBoc().toString('base64') : undefined,
        stateInit: msg.stateInit ? Cell.fromBase64(msg.stateInit).toBoc().toString('base64') : undefined,
      }));

      // TonConnectUI.sendTransaction() が実際にウォレットアプリを起動してユーザー確認を求める
      const result = await this._tonConnectUI.sendTransaction({
        validUntil: txReq.validUntil,
        messages,
      });

      return { boc: result.boc };
    } catch (error) {
      console.error('TON Connect transaction failed:', error);
      throw error;
    }
  }

  private _notifyListeners() {
    const wallet = this.wallet;
    for (const l of this._listeners) {
      try {
        l(wallet);
      } catch (_) {}
    }
  }
}

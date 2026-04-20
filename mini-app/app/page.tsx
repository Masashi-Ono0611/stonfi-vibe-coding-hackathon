'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePrivy, useLogin, useLogout } from '@privy-io/react-auth';
import { useCreateWallet, useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { TonConnectButton, useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { SwapWidget } from '@/components/swap-widget';
import { PrivyTonConnectAdapter } from '@/lib/privy-ton-adapter';
import { TonConnectAdapter } from '@/lib/ton-connect-adapter';

type ConnectionMethod = 'privy' | 'tonconnect';

function TelegramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.012 9.49c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.6 14.11l-2.952-.924c-.642-.2-.654-.642.136-.954l11.53-4.446c.535-.193 1.003.131.248.461z"/>
    </svg>
  );
}

function HeaderWalletStatus({
  hasWallet,
  walletInfo,
  connectionMethod,
  onPrivyLogout,
  onDisconnect,
  onConnectClick,
}: {
  hasWallet: boolean;
  walletInfo: { address: string } | null;
  connectionMethod: ConnectionMethod;
  onPrivyLogout: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onConnectClick: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (!hasWallet) {
    return (
      <button
        onClick={onConnectClick}
        className="text-xs px-3 py-1.5 rounded-full border border-[#e8e8e8] text-[#8d8d8d] bg-white hover:border-[#0071f0] hover:text-[#0071f0] transition-colors cursor-pointer"
      >
        Connect Wallet
      </button>
    );
  }

  const isPrivy = connectionMethod === 'privy';
  const color = isPrivy ? '#0071f0' : '#0088cc';
  const label = isPrivy ? 'P' : 'TC';
  const addr = walletInfo?.address ?? '';
  const shortAddr = addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-white font-medium"
        style={{ backgroundColor: color }}
      >
        <span>{label}</span>
        <span className="font-mono opacity-90">{shortAddr}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="opacity-70">
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 bg-white border border-[#e8e8e8] rounded-lg shadow-md py-1 min-w-[130px] z-20">
            <button
              onClick={() => {
                setOpen(false);
                isPrivy ? onPrivyLogout() : onDisconnect();
              }}
              className="w-full text-left text-xs px-4 py-2 text-[#202020] hover:bg-[#f4f4f4] transition-colors"
            >
              {isPrivy ? 'Logout' : 'Disconnect'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function WelcomeCard() {
  return (
    <a
      href="https://t.me/+gTcwEpkZnUk4ZDI9"
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-[#e8e8e8] rounded-xl p-4 hover:border-[#0088cc] hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0088cc] rounded-full flex items-center justify-center flex-shrink-0 text-white">
          <TelegramIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#202020] group-hover:text-[#0088cc] transition-colors">
            Hawk & Dove Debate Room
          </p>
          <p className="text-xs text-[#8d8d8d] mt-0.5">
            Watch AI agents debate live, then execute the swap
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d8d8d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 group-hover:stroke-[#0088cc] transition-colors">
          <path d="M7 17L17 7M17 7H7M17 7v10"/>
        </svg>
      </div>
    </a>
  );
}

function ConnectionSelector({
  selected,
  onSelect
}: {
  selected: ConnectionMethod;
  onSelect: (method: ConnectionMethod) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onSelect('privy')}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
          selected === 'privy'
            ? 'bg-[#0071f0] text-white'
            : 'bg-[#e8e8e8] text-[#202020] hover:bg-[#d4d4d4]'
        }`}
      >
        Privy
      </button>
      <button
        onClick={() => onSelect('tonconnect')}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
          selected === 'tonconnect'
            ? 'bg-[#0088cc] text-white'
            : 'bg-[#e8e8e8] text-[#202020] hover:bg-[#d4d4d4]'
        }`}
      >
        TON Connect
      </button>
    </div>
  );
}

function PrivyWalletSection({
  onWalletReady,
  onLogout
}: {
  onWalletReady: (wallet: { address: string; publicKey: string }) => void;
  onLogout: () => void;
}) {
  const { user, authenticated } = usePrivy();
  const { login } = useLogin();
  const { logout: privyLogout } = useLogout();
  const { createWallet } = useCreateWallet();

  useEffect(() => {
    const tonWallets = user?.linkedAccounts?.filter(
      (a) => a.type === 'wallet' && a.chainType === 'ton'
    );
    const tonWallet = tonWallets?.[0] as { address?: string; publicKey?: string } | undefined;
    if (tonWallet?.address && tonWallet?.publicKey) {
      onWalletReady({
        address: tonWallet.address,
        publicKey: tonWallet.publicKey
      });
    }
  }, [user, onWalletReady]);

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-[#8d8d8d] text-sm">Login with Privy to manage your embedded wallet</p>
        <button
          onClick={login}
          className="px-6 py-3 bg-[#0071f0] hover:bg-[#0063e0] text-white rounded-lg font-medium transition-colors"
        >
          Login with Privy
        </button>
      </div>
    );
  }

  const tonWallets = user?.linkedAccounts?.filter(
    (a) => a.type === 'wallet' && a.chainType === 'ton'
  );

  const handleCreateTonWallet = async () => {
    try {
      await createWallet({ chainType: 'ton' });
    } catch (e) {
      console.error('Failed to create TON wallet:', e);
    }
  };

  const tonWallet = tonWallets?.[0] as { address?: string; publicKey?: string } | undefined;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0071f0] rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.email?.address?.[0]?.toUpperCase() || user?.telegram?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-[#202020]">
              {user?.telegram?.username || user?.email?.address || 'User'}
            </p>
            <p className="text-xs text-[#8d8d8d]">{user?.id}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-[#8d8d8d] hover:text-[#202020] transition-colors"
        >
          Logout
        </button>
      </div>

      {tonWallet?.address && tonWallet?.publicKey ? (
        <div className="bg-[#f9f9f9] rounded-lg p-4 border border-[#e8e8e8]">
          <p className="text-xs text-[#8d8d8d] mb-1">Privy TON Wallet</p>
          <p className="text-sm font-mono text-[#0071f0] break-all">
            {tonWallet.address}
          </p>
        </div>
      ) : (
        <button
          onClick={handleCreateTonWallet}
          className="w-full py-3 bg-[#0071f0] hover:bg-[#0063e0] text-white rounded-lg font-medium transition-colors"
        >
          Create TON Wallet
        </button>
      )}
    </div>
  );
}

function TonConnectWalletSection({
  onWalletReady,
  onDisconnect
}: {
  onWalletReady: (wallet: { address: string }, tcWallet?: any) => void;
  onDisconnect: () => void;
}) {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  const address = wallet?.account?.address;
  const connected = !!wallet;

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    if (addr.startsWith('0:')) {
      const hex = addr.slice(2);
      return `EQ${hex}`;
    }
    return addr;
  };

  const formattedAddress = address ? formatAddress(address) : '';

  const handleDisconnect = async () => {
    await tonConnectUI?.disconnect();
    onDisconnect();
  };

  useEffect(() => {
    if (connected && formattedAddress) {
      onWalletReady({ address: formattedAddress }, wallet);
    }
  }, [connected, formattedAddress, onWalletReady, wallet]);

  if (!connected || !address) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-[#8d8d8d] text-sm">Connect your TON wallet with TON Connect</p>
        <TonConnectButton className="!bg-[#0088cc] hover:!bg-[#0066aa]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0088cc] rounded-full flex items-center justify-center text-white text-sm font-bold">
            TC
          </div>
          <div>
            <p className="text-sm font-medium text-[#202020]">TON Connect</p>
            <p className="text-xs text-[#8d8d8d]">{formattedAddress.slice(0, 6)}...{formattedAddress.slice(-4)}</p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-[#8d8d8d] hover:text-[#202020] transition-colors"
        >
          Disconnect
        </button>
      </div>

      <div className="bg-[#f9f9f9] rounded-lg p-4 border border-[#e8e8e8]">
        <p className="text-xs text-[#8d8d8d] mb-1">TON Connect Wallet</p>
        <p className="text-sm font-mono text-[#0088cc] break-all">
          {formattedAddress}
        </p>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function Home() {
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>('privy');
  const { authenticated, user } = usePrivy();
  const { logout } = useLogout();
  const { signRawHash } = useSignRawHash();

  const [walletInfo, setWalletInfo] = useState<{
    address: string;
    publicKey?: string;
    adapter: PrivyTonConnectAdapter | TonConnectAdapter;
    tcWallet?: any;
  } | null>(null);

  const walletInfoRef = useRef(walletInfo);
  walletInfoRef.current = walletInfo;

  const walletCardRef = useRef<HTMLDivElement>(null);
  const handleConnectClick = useCallback(() => {
    walletCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleWalletReady = (wallet: { address: string; publicKey?: string }, tcWallet?: any) => {
    if (connectionMethod === 'privy') {
      const adapter = new PrivyTonConnectAdapter();
      setWalletInfo({
        address: wallet.address,
        publicKey: wallet.publicKey,
        adapter: adapter as any,
      });
    } else {
      const adapter = new TonConnectAdapter();
      adapter.connect(tcWallet!);
      setWalletInfo({
        address: wallet.address,
        adapter: adapter as any,
        tcWallet: tcWallet,
      });
    }
  };

  const handleDisconnect = useCallback(async () => {
    const currentWalletInfo = walletInfoRef.current;
    if (currentWalletInfo?.adapter) {
      try {
        await currentWalletInfo.adapter.disconnect();
      } catch (error) {
        console.error('Failed to disconnect adapter:', error);
      }
    }
    setWalletInfo(null);
  }, []);

  useEffect(() => {
    const cleanup = async () => {
      const currentWalletInfo = walletInfoRef.current;
      if (currentWalletInfo?.adapter) {
        try {
          await currentWalletInfo.adapter.disconnect();
        } catch (error) {
          console.error('Failed to disconnect adapter on method change:', error);
        }
        setWalletInfo(null);
      }
    };

    cleanup();
  }, [connectionMethod]);

  useEffect(() => {
    if (connectionMethod === 'privy' && !authenticated && walletInfoRef.current) {
      handleDisconnect();
    }
  }, [authenticated, connectionMethod, handleDisconnect]);

  const handlePrivyLogout = useCallback(async () => {
    await handleDisconnect();
    await logout();
  }, [handleDisconnect, logout]);

  const hasWallet = !!walletInfo;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
      {/* ヘッダー */}
      <header className="border-b border-[#e8e8e8] px-4 py-3 bg-[#f4f4f4]">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <span className="text-lg">🦅</span>
          <h1 className="text-sm font-semibold text-[#202020]">Hawk & Dove</h1>
          <div className="ml-auto">
            <HeaderWalletStatus
              hasWallet={hasWallet}
              walletInfo={walletInfo}
              connectionMethod={connectionMethod}
              onPrivyLogout={handlePrivyLogout}
              onDisconnect={handleDisconnect}
              onConnectClick={handleConnectClick}
            />
          </div>
        </div>
      </header>

      {/* メイン */}
      <main className="flex-1 flex flex-col gap-4 max-w-lg mx-auto w-full px-4 py-6">
        {/* TGカード: 常時表示 */}
        <WelcomeCard />

        {/* ウォレット接続カード */}
        <div ref={walletCardRef} className="bg-white rounded-xl border border-[#e8e8e8] p-4">
          <ConnectionSelector
            selected={connectionMethod}
            onSelect={setConnectionMethod}
          />
          <div className="border-t border-[#e8e8e8] -mx-4 mt-4 mb-0" />
          {connectionMethod === 'privy' ? (
            <PrivyWalletSection
              onWalletReady={handleWalletReady}
              onLogout={handlePrivyLogout}
            />
          ) : (
            <TonConnectWalletSection
              onWalletReady={handleWalletReady}
              onDisconnect={handleDisconnect}
            />
          )}
        </div>

        {/* Swapウィジェット: 接続済み時のみ表示 */}
        {hasWallet && walletInfo && (
          <SwapWidget
            walletAddress={walletInfo.address}
            publicKey={walletInfo.publicKey || ''}
            signRawHash={connectionMethod === 'privy' ? signRawHash : undefined}
            tcWallet={walletInfo.tcWallet}
          />
        )}
      </main>

      {/* フッター: TGリンク常設 */}
      <footer className="border-t border-[#e8e8e8] px-4 py-3 bg-[#f4f4f4]">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-1.5">
          <span className="text-[#8d8d8d]">
            <TelegramIcon size={14} />
          </span>
          <a
            href="https://t.me/+gTcwEpkZnUk4ZDI9"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#8d8d8d] hover:text-[#0088cc] transition-colors"
          >
            Hawk & Dove Debate Room
          </a>
        </div>
      </footer>
    </div>
  );
}

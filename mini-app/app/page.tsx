'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePrivy, useLogin, useLogout } from '@privy-io/react-auth';
import { useCreateWallet, useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { TonConnectButton, useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { SwapWidget } from '@/components/swap-widget';
import { PrivyTonConnectAdapter } from '@/lib/privy-ton-adapter';
import { TonConnectAdapter } from '@/lib/ton-connect-adapter';

// ─── 型定義 ───────────────────────────────────────────────
type PrivyWalletInfo = {
  address: string;
  publicKey: string;
  adapter: PrivyTonConnectAdapter;
};
type TcWalletInfo = {
  address: string;
  adapter: TonConnectAdapter;
  rawWallet: any;
};
type ActiveWallet = 'privy' | 'tonconnect';

// ─── ユーティリティ ───────────────────────────────────────
function TelegramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.012 9.49c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.6 14.11l-2.952-.924c-.642-.2-.654-.642.136-.954l11.53-4.446c.535-.193 1.003.131.248.461z"/>
    </svg>
  );
}

// ─── ヘッダーウォレットボタン ─────────────────────────────
function WalletPill({
  label,
  color,
  address,
  onConnect,
  onAction,
  actionLabel,
}: {
  label: string;
  color: string;
  address?: string;
  onConnect: () => void;
  onAction: () => void;
  actionLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const connected = !!address;
  const shortAddr = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : '';

  if (!connected) {
    return (
      <button
        onClick={onConnect}
        className="text-xs px-3 py-1.5 rounded-full border border-[#e8e8e8] text-[#8d8d8d] bg-white hover:border-current hover:text-current transition-colors cursor-pointer"
        style={{ ['--tw-ring-color' as any]: color }}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-white font-medium"
        style={{ backgroundColor: color }}
      >
        <span>{label}</span>
        <span className="font-mono opacity-90">{shortAddr}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 bg-white border border-[#e8e8e8] rounded-lg shadow-md py-1 min-w-[130px] z-20">
            <button
              onClick={() => { setOpen(false); onAction(); }}
              className="w-full text-left text-xs px-4 py-2 text-[#202020] hover:bg-[#f4f4f4] transition-colors"
            >
              {actionLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TGカード ─────────────────────────────────────────────
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

// ─── Privy ウォレットセクション ───────────────────────────
function PrivyWalletSection({
  onWalletReady,
  onLogout,
}: {
  onWalletReady: (wallet: { address: string; publicKey: string }) => void;
  onLogout: () => void;
}) {
  const { user, authenticated } = usePrivy();
  const { login } = useLogin();
  const { createWallet } = useCreateWallet();

  useEffect(() => {
    const tonWallet = user?.linkedAccounts?.find(
      (a) => a.type === 'wallet' && a.chainType === 'ton'
    ) as { address?: string; publicKey?: string } | undefined;
    if (tonWallet?.address && tonWallet?.publicKey) {
      onWalletReady({ address: tonWallet.address, publicKey: tonWallet.publicKey });
    }
  }, [user, onWalletReady]);

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-[#8d8d8d] text-sm text-center">Login with Privy to create an embedded TON wallet</p>
        <button
          onClick={login}
          className="px-6 py-3 bg-[#0071f0] hover:bg-[#0063e0] text-white rounded-lg font-medium transition-colors"
        >
          Login with Privy
        </button>
      </div>
    );
  }

  const tonWallet = user?.linkedAccounts?.find(
    (a) => a.type === 'wallet' && a.chainType === 'ton'
  ) as { address?: string; publicKey?: string } | undefined;

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
          </div>
        </div>
        <button onClick={onLogout} className="text-xs text-[#8d8d8d] hover:text-[#202020] transition-colors">
          Logout
        </button>
      </div>

      {tonWallet?.address ? (
        <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#e8e8e8]">
          <p className="text-xs text-[#8d8d8d] mb-1">Privy TON Wallet</p>
          <p className="text-xs font-mono text-[#0071f0] break-all">{tonWallet.address}</p>
        </div>
      ) : (
        <button
          onClick={() => createWallet({ chainType: 'ton' }).catch(console.error)}
          className="w-full py-3 bg-[#0071f0] hover:bg-[#0063e0] text-white rounded-lg font-medium transition-colors"
        >
          Create TON Wallet
        </button>
      )}
    </div>
  );
}

// ─── TON Connect ウォレットセクション ─────────────────────
function TonConnectWalletSection({
  onWalletReady,
  onDisconnect,
}: {
  onWalletReady: (wallet: { address: string }, rawWallet: any) => void;
  onDisconnect: () => void;
}) {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const address = wallet?.account?.address;
  const connected = !!wallet;

  const formatAddress = (addr: string) =>
    addr.startsWith('0:') ? `EQ${addr.slice(2)}` : addr;

  const formattedAddress = address ? formatAddress(address) : '';

  useEffect(() => {
    if (connected && formattedAddress) {
      onWalletReady({ address: formattedAddress }, wallet);
    }
  }, [connected, formattedAddress, onWalletReady, wallet]);

  if (!connected || !address) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-[#8d8d8d] text-sm text-center">Connect your TON wallet with TON Connect</p>
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
          <p className="text-sm font-medium text-[#202020]">TON Connect</p>
        </div>
        <button
          onClick={async () => { await tonConnectUI?.disconnect(); onDisconnect(); }}
          className="text-xs text-[#8d8d8d] hover:text-[#202020] transition-colors"
        >
          Disconnect
        </button>
      </div>
      <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#e8e8e8]">
        <p className="text-xs text-[#8d8d8d] mb-1">TON Connect Wallet</p>
        <p className="text-xs font-mono text-[#0088cc] break-all">{formattedAddress}</p>
      </div>
    </div>
  );
}

// ─── ウォレットモーダル ───────────────────────────────────
function WalletModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e8e8]">
          <h2 className="text-sm font-semibold text-[#202020]">{title}</h2>
          <button onClick={onClose} className="text-[#8d8d8d] hover:text-[#202020] transition-colors text-lg leading-none">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────
export const dynamic = 'force-dynamic';

export default function Home() {
  const { authenticated, user } = usePrivy();
  const { logout } = useLogout();
  const { signRawHash } = useSignRawHash();
  const tcWalletState = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  // Privy と TON Connect を完全独立して管理
  const [privyWallet, setPrivyWallet] = useState<PrivyWalletInfo | null>(null);
  const [tcWallet, setTcWallet] = useState<TcWalletInfo | null>(null);
  const [activeWallet, setActiveWallet] = useState<ActiveWallet | null>(null);

  // モーダル開閉
  const [showPrivyModal, setShowPrivyModal] = useState(false);
  const [showTcModal, setShowTcModal] = useState(false);

  // 明示的にdisconnectしたフラグ（自動再接続防止）
  const tcManuallyDisconnected = useRef(false);

  // ─── Privy 状態復元（ページロード時） ───────────────────
  useEffect(() => {
    if (!authenticated || privyWallet) return;
    const tonWallet = user?.linkedAccounts?.find(
      (a) => a.type === 'wallet' && a.chainType === 'ton'
    ) as { address?: string; publicKey?: string } | undefined;
    if (tonWallet?.address && tonWallet?.publicKey) {
      const adapter = new PrivyTonConnectAdapter();
      setPrivyWallet({ address: tonWallet.address, publicKey: tonWallet.publicKey, adapter });
      setActiveWallet('privy');
    }
  }, [authenticated, user, privyWallet]);

  // ─── TON Connect 状態復元（ページロード時） ──────────────
  useEffect(() => {
    if (!tcWalletState || tcWallet || tcManuallyDisconnected.current) return;
    const addr = tcWalletState.account?.address;
    if (!addr) return;
    const formatted = addr.startsWith('0:') ? `EQ${addr.slice(2)}` : addr;
    const adapter = new TonConnectAdapter();
    adapter.connect(tcWalletState);
    setTcWallet({ address: formatted, adapter, rawWallet: tcWalletState });
    setActiveWallet((prev) => prev ?? 'tonconnect');
  }, [tcWalletState, tcWallet]);

  // モーダル自動クローズ（接続完了時）
  useEffect(() => { if (privyWallet) setShowPrivyModal(false); }, [privyWallet]);
  useEffect(() => { if (tcWallet) setShowTcModal(false); }, [tcWallet]);

  // ─── Privy ウォレット接続コールバック ────────────────────
  const handlePrivyWalletReady = useCallback((wallet: { address: string; publicKey: string }) => {
    if (privyWallet?.address === wallet.address) return;
    const adapter = new PrivyTonConnectAdapter();
    setPrivyWallet({ address: wallet.address, publicKey: wallet.publicKey, adapter });
    setActiveWallet('privy');
  }, [privyWallet]);

  // ─── Privy ログアウト ─────────────────────────────────────
  const handlePrivyLogout = useCallback(async () => {
    if (privyWallet?.adapter) {
      try { await privyWallet.adapter.disconnect(); } catch (_) {}
    }
    setPrivyWallet(null);
    if (activeWallet === 'privy') setActiveWallet(tcWallet ? 'tonconnect' : null);
    await logout();
  }, [privyWallet, activeWallet, tcWallet, logout]);

  // ─── TON Connect 接続コールバック ────────────────────────
  const handleTcWalletReady = useCallback((wallet: { address: string }, rawWallet: any) => {
    if (tcWallet?.address === wallet.address) return;
    tcManuallyDisconnected.current = false;
    const adapter = new TonConnectAdapter();
    adapter.connect(rawWallet);
    setTcWallet({ address: wallet.address, adapter, rawWallet });
    setActiveWallet('tonconnect');
  }, [tcWallet]);

  // ─── TON Connect 切断 ────────────────────────────────────
  const handleTcDisconnect = useCallback(async () => {
    tcManuallyDisconnected.current = true;
    if (tcWallet?.adapter) {
      try { await tcWallet.adapter.disconnect(); } catch (_) {}
    }
    try { await tonConnectUI?.disconnect(); } catch (_) {}
    setTcWallet(null);
    if (activeWallet === 'tonconnect') setActiveWallet(privyWallet ? 'privy' : null);
  }, [tcWallet, tonConnectUI, activeWallet, privyWallet]);

  // Privyがログアウトされたら state をクリア
  useEffect(() => {
    if (!authenticated && privyWallet) {
      setPrivyWallet(null);
      if (activeWallet === 'privy') setActiveWallet(tcWallet ? 'tonconnect' : null);
    }
  }, [authenticated, privyWallet, activeWallet, tcWallet]);

  // SwapWidgetに渡す情報
  const swapWalletAddress = activeWallet === 'privy' ? privyWallet?.address : tcWallet?.address;
  const swapPublicKey = activeWallet === 'privy' ? (privyWallet?.publicKey ?? '') : '';
  const swapSignRawHash = activeWallet === 'privy' ? signRawHash : undefined;
  const swapTcWallet = activeWallet === 'tonconnect' ? tcWallet?.rawWallet : undefined;
  const hasActiveWallet = !!swapWalletAddress;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
      {/* ヘッダー */}
      <header className="border-b border-[#e8e8e8] px-4 py-3 bg-[#f4f4f4]">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <span className="text-lg">🦅</span>
          <h1 className="text-sm font-semibold text-[#202020]">Hawk & Dove</h1>
          <div className="ml-auto flex items-center gap-2">
            {/* Privy ステータス */}
            <WalletPill
              label="P"
              color="#0071f0"
              address={privyWallet?.address}
              onConnect={() => setShowPrivyModal(true)}
              onAction={handlePrivyLogout}
              actionLabel="Logout"
            />
            {/* TON Connect ステータス */}
            <WalletPill
              label="TC"
              color="#0088cc"
              address={tcWallet?.address}
              onConnect={() => { tcManuallyDisconnected.current = false; setShowTcModal(true); }}
              onAction={handleTcDisconnect}
              actionLabel="Disconnect"
            />
          </div>
        </div>
      </header>

      {/* Privy モーダル */}
      {showPrivyModal && (
        <WalletModal title="Connect with Privy" onClose={() => setShowPrivyModal(false)}>
          <PrivyWalletSection
            onWalletReady={handlePrivyWalletReady}
            onLogout={handlePrivyLogout}
          />
        </WalletModal>
      )}

      {/* TON Connect モーダル */}
      {showTcModal && (
        <WalletModal title="Connect with TON Connect" onClose={() => setShowTcModal(false)}>
          <TonConnectWalletSection
            onWalletReady={handleTcWalletReady}
            onDisconnect={handleTcDisconnect}
          />
        </WalletModal>
      )}

      {/* メイン */}
      <main className="flex-1 flex flex-col gap-4 max-w-lg mx-auto w-full px-4 py-6">
        <WelcomeCard />

        {/* 未接続時CTA */}
        {!hasActiveWallet && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[#8d8d8d] px-1">Connect a wallet to start swapping</p>
            <button
              onClick={() => setShowPrivyModal(true)}
              className="w-full bg-[#0071f0] hover:bg-[#0063e0] rounded-xl p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#0071f0] text-xs font-bold flex-shrink-0">P</div>
                  <div>
                    <p className="text-sm font-medium text-white">Privy</p>
                    <p className="text-xs text-white/70 mt-0.5">Passkey or email — no wallet app needed</p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>
            <button
              onClick={() => { tcManuallyDisconnected.current = false; setShowTcModal(true); }}
              className="w-full bg-[#0088cc] hover:bg-[#0066aa] rounded-xl p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#0088cc] text-xs font-bold flex-shrink-0">TC</div>
                  <div>
                    <p className="text-sm font-medium text-white">TON Connect</p>
                    <p className="text-xs text-white/70 mt-0.5">Tonkeeper or any TON wallet app</p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* 接続済みウォレット切り替え（両方接続時） */}
        {privyWallet && tcWallet && (
          <div className="bg-white rounded-xl border border-[#e8e8e8] p-3 flex gap-2">
            <button
              onClick={() => setActiveWallet('privy')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeWallet === 'privy' ? 'bg-[#0071f0] text-white' : 'bg-[#e8e8e8] text-[#202020] hover:bg-[#d4d4d4]'
              }`}
            >
              Swap with Privy
            </button>
            <button
              onClick={() => setActiveWallet('tonconnect')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeWallet === 'tonconnect' ? 'bg-[#0088cc] text-white' : 'bg-[#e8e8e8] text-[#202020] hover:bg-[#d4d4d4]'
              }`}
            >
              Swap with TON Connect
            </button>
          </div>
        )}

        {/* Swap ウィジェット */}
        {hasActiveWallet && swapWalletAddress && (
          <SwapWidget
            walletAddress={swapWalletAddress}
            publicKey={swapPublicKey}
            signRawHash={swapSignRawHash}
            tcWallet={swapTcWallet}
          />
        )}
      </main>

      {/* フッター */}
      <footer className="border-t border-[#e8e8e8] px-4 py-3 bg-[#f4f4f4]">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-1.5">
          <span className="text-[#8d8d8d]"><TelegramIcon size={14} /></span>
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

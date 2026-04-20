'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePrivy, useLogin, useLogout } from '@privy-io/react-auth';
import { useCreateWallet, useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { TonConnectButton, useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { SwapWidget } from '@/components/swap-widget';
import { PrivyTonConnectAdapter } from '@/lib/privy-ton-adapter';
import { TonConnectAdapter } from '@/lib/ton-connect-adapter';

type ConnectionMethod = 'privy' | 'tonconnect';

function ConnectionSelector({
  selected,
  onSelect
}: {
  selected: ConnectionMethod;
  onSelect: (method: ConnectionMethod) => void;
}) {
  return (
    <div className="flex gap-2 mb-6">
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
    // Check if already has TON wallet
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
    <div className="flex flex-col gap-4 py-6">
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

  // Convert raw address (0:...) to user-friendly format (EQ...)
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    if (addr.startsWith('0:')) {
      // Convert 0:hex to EQ format
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
    <div className="flex flex-col gap-4 py-6">
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

  // Handle wallet ready callback
  const handleWalletReady = (wallet: { address: string; publicKey?: string }, tcWallet?: any) => {
    if (connectionMethod === 'privy') {
      const adapter = new PrivyTonConnectAdapter();
      // Note: We'll initialize the adapter when SwapWidget mounts
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

  // Handle wallet disconnect
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

  // Disconnect current wallet when connection method changes
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

  // Handle Privy logout - disconnect Omniston widget
  useEffect(() => {
    if (connectionMethod === 'privy' && !authenticated && walletInfoRef.current) {
      handleDisconnect();
    }
  }, [authenticated, connectionMethod, handleDisconnect]);

  // Add logout handler to PrivyWalletSection
  const handlePrivyLogout = useCallback(async () => {
    await handleDisconnect();
    await logout();
  }, [handleDisconnect, logout]);

  const hasWallet = !!walletInfo;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
      <header className="border-b border-[#e8e8e8] px-4 py-3 bg-[#f4f4f4]">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <span className="text-lg">🦅</span>
          <h1 className="text-sm font-semibold text-[#202020]">Hawk & Dove Trading Council</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-6 max-w-lg mx-auto w-full px-4 py-6">
        <section>
          <ConnectionSelector
            selected={connectionMethod}
            onSelect={setConnectionMethod}
          />
        </section>

        <section>
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
        </section>

        {hasWallet && walletInfo && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">🔄</span>
              <h2 className="text-sm font-semibold text-[#202020]">Swap</h2>
            </div>
            <SwapWidget
              walletAddress={walletInfo.address}
              publicKey={walletInfo.publicKey || ''}
              signRawHash={connectionMethod === 'privy' ? signRawHash : undefined}
              tcWallet={walletInfo.tcWallet}
            />
          </section>
        )}
      </main>
    </div>
  );
}

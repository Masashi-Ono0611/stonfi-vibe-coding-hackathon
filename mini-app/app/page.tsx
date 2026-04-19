'use client';

import { usePrivy, useLogin, useLogout } from '@privy-io/react-auth';
import { useCreateWallet, useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { SwapWidget } from '@/components/swap-widget';

function WalletSection() {
  const { user, authenticated } = usePrivy();
  const { login } = useLogin();
  const { logout } = useLogout();
  const { createWallet } = useCreateWallet();

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-zinc-400 text-sm">Login to manage your embedded wallet</p>
        <button
          onClick={login}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Login
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
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.email?.address?.[0]?.toUpperCase() || user?.telegram?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {user?.telegram?.username || user?.email?.address || 'User'}
            </p>
            <p className="text-xs text-zinc-500">{user?.id}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>

      {tonWallet?.address ? (
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <p className="text-xs text-zinc-500 mb-1">TON Wallet</p>
          <p className="text-sm font-mono text-blue-400 break-all">
            {tonWallet.address}
          </p>
        </div>
      ) : (
        <button
          onClick={handleCreateTonWallet}
          className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-zinc-700"
        >
          Create TON Wallet
        </button>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function Home() {
  const { authenticated, user } = usePrivy();
  const { signRawHash } = useSignRawHash();

  const tonWallets = user?.linkedAccounts?.filter(
    (a) => a.type === 'wallet' && a.chainType === 'ton'
  );

  const tonWallet = tonWallets?.[0] as { address?: string; publicKey?: string } | undefined;

  // Debug: Check if publicKey is available
  console.log('TON Wallet:', tonWallet);
  console.log('Public Key:', tonWallet?.publicKey);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <span className="text-lg">🦅</span>
          <h1 className="text-sm font-semibold text-white">Hawk & Dove Trading Council</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-6 max-w-lg mx-auto w-full px-4 py-6">
        <section>
          <WalletSection />
        </section>

        {authenticated && tonWallet?.address && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">🔄</span>
              <h2 className="text-sm font-semibold text-white">Swap</h2>
            </div>
            <SwapWidget
              walletAddress={tonWallet.address}
              publicKey={tonWallet.publicKey || ''}
              signRawHash={signRawHash}
            />
          </section>
        )}
      </main>
    </div>
  );
}

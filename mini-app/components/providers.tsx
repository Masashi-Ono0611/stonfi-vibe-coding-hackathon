'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">Missing NEXT_PUBLIC_PRIVY_APP_ID</div>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['telegram', 'email', 'wallet', 'google'],
        embeddedWallets: {
          ethereum: { createOnLogin: 'users-without-wallets' },
        },
        appearance: {
          accentColor: '#1d4ed8',
          theme: 'dark',
          logo: 'https://hawk-dove-mini-app.vercel.app/icon.png',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

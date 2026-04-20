'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

// TODO: 本番デプロイ時に独自のTON Connect manifest URLを作成して置き換え
// 参考: bagel-financeプロジェクトではS3にホスティング
// 現在はテスト用にbagel-financeのmanifestを使用
const MANIFEST_URL = 'https://mini-app-rho-bay.vercel.app/tonconnect-manifest.json';

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">Missing NEXT_PUBLIC_PRIVY_APP_ID</div>;
  }

  return (
    <TonConnectUIProvider
      manifestUrl={MANIFEST_URL}
      uiPreferences={{ theme: 'SYSTEM', borderRadius: 'm' }}
    >
      <PrivyProvider
        appId={appId}
        config={{
          loginMethods: ['email', 'passkey', 'google'],
          embeddedWallets: {
            createOnLogin: 'all-users',
          },
          appearance: {
            accentColor: '#1d4ed8',
            theme: 'dark',
            logo: 'https://mini-app-rho-bay.vercel.app/icon.png',
          },
        }}
      >
        {children}
      </PrivyProvider>
    </TonConnectUIProvider>
  );
}

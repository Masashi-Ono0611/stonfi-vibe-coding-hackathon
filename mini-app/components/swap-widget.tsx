'use client';

import { useEffect, useRef } from 'react';
import omnistonWidgetLoader from '@ston-fi/omniston-widget-loader';
import type { OmnistonWidget } from '@ston-fi/omniston-widget-loader';
import { PrivyTonConnectAdapter } from '@/lib/privy-ton-adapter';
import { TonConnectAdapter } from '@/lib/ton-connect-adapter';

type SignRawHashFunction = (params: {
  address: string;
  chainType: 'ton';
  hash: `0x${string}`;
}) => Promise<{ signature: string }>;

interface Adapter {
  disconnect(): Promise<void>;
}

interface SwapWidgetProps {
  walletAddress?: string;
  publicKey?: string;
  signRawHash?: SignRawHashFunction;
  tcWallet?: any;
  tonConnectUI?: any;
}

export function SwapWidget({ walletAddress, publicKey, signRawHash, tcWallet, tonConnectUI }: SwapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<OmnistonWidget | null>(null);
  const adapterRef = useRef<Adapter | null>(null);

  useEffect(() => {
    if (!containerRef.current || !walletAddress) return;

    let isMounted = true;

    const initializeWidget = async () => {
      try {
        let adapter: Adapter | null = null;

        if (publicKey && signRawHash) {
          // Use Privy adapter
          const privyAdapter = new PrivyTonConnectAdapter();

          await privyAdapter.connect(
            walletAddress,
            publicKey,
            async (data: string) => {
              const result = await signRawHash({
                address: walletAddress,
                chainType: 'ton',
                hash: `0x${data}` as const,
              });
              if (result.signature) {
                return Buffer.from(result.signature, 'hex');
              }
              throw new Error('Failed to sign transaction');
            }
          );

          adapter = privyAdapter;
        } else if (tcWallet && tonConnectUI) {
          // Use TON Connect adapter — requires TonConnectUI to trigger wallet app
          const tcAdapter = new TonConnectAdapter();
          await tcAdapter.connect(tonConnectUI, tcWallet);
          adapter = tcAdapter;
        }

        if (!isMounted || !containerRef.current) return;

        adapterRef.current = adapter;

        const WidgetConstructor = await omnistonWidgetLoader.load();

        const config: any = {
          widget: {
            defaultBidAsset: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
            defaultAskAsset: 'EQDhyPzbIjJT_WnY3gGprjSYUK9fiGMjWMezxO8MZiUdfb_B',
          },
        };

        // Only add tonconnect config if adapter is available
        if (adapter) {
          config.tonconnect = {
            type: 'integrated',
            instance: adapter,
          };
        } else {
          config.tonconnect = {
            type: 'standalone',
            options: {
              manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
            },
          };
        }

        if (!isMounted || !containerRef.current) return;

        widgetRef.current = new WidgetConstructor(config);
        widgetRef.current.mount(containerRef.current);
      } catch (error) {
        console.error('Failed to initialize widget:', error);
      }
    };

    initializeWidget();

    return () => {
      isMounted = false;
      widgetRef.current?.unmount();
      widgetRef.current = null;
      adapterRef.current?.disconnect();
      adapterRef.current = null;
    };
  }, [walletAddress, publicKey, signRawHash, tcWallet, tonConnectUI]);

  if (!walletAddress) {
    return (
      <div className="w-full max-w-[420px] mx-auto bg-[#f9f9f9] rounded-lg p-8 border border-[#e8e8e8] text-center">
        <p className="text-[#8d8d8d] text-sm">Connect your TON wallet to start swapping</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div ref={containerRef} className="w-full min-h-[400px]" />
    </div>
  );
}

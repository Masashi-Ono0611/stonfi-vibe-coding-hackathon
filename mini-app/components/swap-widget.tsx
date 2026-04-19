'use client';

import { useEffect, useRef } from 'react';
import omnistonWidgetLoader from '@ston-fi/omniston-widget-loader';
import type { OmnistonWidget } from '@ston-fi/omniston-widget-loader';
import { PrivyTonConnectAdapter } from '@/lib/privy-ton-adapter';

type SignRawHashFunction = (params: {
  address: string;
  chainType: 'ton';
  hash: `0x${string}`;
}) => Promise<{ signature: string }>;

interface SwapWidgetProps {
  walletAddress?: string;
  publicKey?: string;
  signRawHash: SignRawHashFunction;
}

export function SwapWidget({ walletAddress, publicKey, signRawHash }: SwapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<OmnistonWidget | null>(null);
  const adapterRef = useRef<PrivyTonConnectAdapter | null>(null);

  useEffect(() => {
    if (!containerRef.current || !walletAddress) return;

    if (!publicKey) {
      // If publicKey is not available, just show the widget without connecting wallet
      let isMounted = true;

      omnistonWidgetLoader.load().then((WidgetConstructor) => {
        if (!isMounted || !containerRef.current) return;

        widgetRef.current = new WidgetConstructor({
          tonconnect: {
            type: 'standalone',
            options: {
              manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
            },
          },
          widget: {
            defaultBidAsset: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            defaultAskAsset: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO',
          },
        });

        widgetRef.current.mount(containerRef.current);
      });

      return () => {
        isMounted = false;
        widgetRef.current?.unmount();
        widgetRef.current = null;
      };
    }

    let isMounted = true;

    const initializeWidget = async () => {
      try {
        const adapter = new PrivyTonConnectAdapter();

        await adapter.connect(
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

        adapterRef.current = adapter;

        const WidgetConstructor = await omnistonWidgetLoader.load();

        if (!isMounted || !containerRef.current) return;

        widgetRef.current = new WidgetConstructor({
          tonconnect: {
            type: 'integrated',
            instance: adapter as any,
          },
          widget: {
            defaultBidAsset: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            defaultAskAsset: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO',
          },
        });

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
  }, [walletAddress, publicKey, signRawHash]);

  if (!walletAddress) {
    return (
      <div className="w-full max-w-[420px] mx-auto bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
        <p className="text-gray-500 text-sm">Connect your TON wallet to start swapping</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div ref={containerRef} className="w-full min-h-[400px]" />
    </div>
  );
}

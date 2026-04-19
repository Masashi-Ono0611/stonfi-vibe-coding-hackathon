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
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

interface SwapWidgetProps {
  walletAddress?: string;
  publicKey?: string;
  signRawHash?: SignRawHashFunction;
}

export function SwapWidget({ walletAddress, publicKey, signRawHash }: SwapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<OmnistonWidget | null>(null);
  const adapterRef = useRef<Adapter | null>(null);

  useEffect(() => {
    if (!containerRef.current || !walletAddress) return;

    const initializeWidget = async () => {
      try {
        let adapter: Adapter;

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
        } else {
          // Use TON Connect adapter (will be initialized by page.tsx)
          adapter = new TonConnectAdapter();
        }

        adapterRef.current = adapter;

        const WidgetConstructor = await omnistonWidgetLoader.load();

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
      widgetRef.current?.unmount();
      widgetRef.current = null;
      adapterRef.current?.disconnect();
      adapterRef.current = null;
    };
  }, [walletAddress, publicKey, signRawHash]);

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

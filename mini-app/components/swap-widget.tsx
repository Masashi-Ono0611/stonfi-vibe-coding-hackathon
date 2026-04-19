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

  console.log('SwapWidget render:', { walletAddress, publicKey, hasSignRawHash: !!signRawHash });

  useEffect(() => {
    console.log('SwapWidget useEffect:', { walletAddress, publicKey, hasContainer: !!containerRef.current });

    if (!containerRef.current || !walletAddress) {
      console.log('Early return: no container or address');
      return;
    }

    if (!publicKey) {
      console.log('No publicKey, loading widget in standalone mode');
      // If publicKey is not available, just show the widget without connecting wallet
      let isMounted = true;

      omnistonWidgetLoader.load().then((WidgetConstructor) => {
        console.log('Widget loaded in standalone mode');
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

    console.log('Has publicKey, initializing adapter');
    let isMounted = true;

    const initializeWidget = async () => {
      try {
        console.log('Creating adapter...');
        const adapter = new PrivyTonConnectAdapter();

        console.log('Connecting adapter...');
        await adapter.connect(
          walletAddress,
          publicKey,
          async (data: string) => {
            console.log('Signing transaction:', data);
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

        console.log('Adapter connected');
        adapterRef.current = adapter;

        console.log('Loading Omniston Widget...');
        const WidgetConstructor = await omnistonWidgetLoader.load();

        if (!isMounted || !containerRef.current) return;

        console.log('Creating widget with integrated tonconnect');
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

        console.log('Mounting widget');
        widgetRef.current.mount(containerRef.current);
        console.log('Widget mounted successfully');
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
      <div className="w-full max-w-[420px] mx-auto bg-zinc-900 rounded-lg p-8 border border-zinc-800 text-center">
        <p className="text-zinc-400 text-sm">Connect your TON wallet to start swapping</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div ref={containerRef} className="w-full min-h-[400px]" />
    </div>
  );
}

# SDK & Technical Resources

## Important Categories (from Workshop Slide 30)

> "Help your agent by sharing STON.fi docs: https://docs.ston.fi/"

### Docs: https://docs.ston.fi/

---

## Omniston v1beta8 (Current Target)

> **Hackathon uses v1beta8 RC** — Production release scheduled April 22 (after submission deadline).
> We use the sandbox for cross-chain features.

| | Current (v1beta7) | v1beta8 RC |
|---|---|---|
| npm | `@ston-fi/omniston-sdk@0.7.9` | `@ston-fi/omniston-sdk@0.8.0-rc.0` |
| WebSocket | `wss://omni-ws.ston.fi` | `wss://omni-ws-sandbox.ston.fi` |
| Proto namespace | `omni.v1beta7` | `stonfi.omni.v1beta8` |
| Cross-chain | TON only | TON + EVM (ETH, Base, Arbitrum, BNB, AVAX, Polygon) |

### Key Breaking Changes (v1beta7 → v1beta8)

| v1beta7 | v1beta8 |
|---------|---------|
| `bid` / `ask` | `input` / `output` |
| `bidAssetAddress` | `inputAsset` (AssetId) |
| `askAssetAddress` | `outputAsset` (AssetId) |
| `bidUnits` / `askUnits` | `inputUnits` / `outputUnits` |
| `referrerAddress` | `integratorAddress` |
| `referrerFeeBps` | `integratorFeePips` (**100x finer: 1/1000000**) |
| `SettlementMethod.ESCROW` / `.HTLC` | `SettlementMethod.ORDER` |
| `buildTransfer` | `tonBuildSwap` |
| `trackTrade` | `swapTrack` / `orderTrack` |

### New Cross-Chain Types

- `ChainAddress` — TON, Ethereum, Arbitrum, Base, BNB Chain, Avalanche, Polygon
- `AssetId` — native, jetton (TON), ERC-20, ERC-1155 (EVM)
- `evmBuildOrderPayload()` / `evmBuildOrderCancellation()`
- `orderTrack()` / `orderGetActive()` / `orderCancelSignedOrder()`

### Sandbox Demo App

- Live at: https://omniston-sandbox.ston.fi/
- Source code removed from SDK repo (no reference implementation available)
- WebSocket confirmed live (HTTP 101 response verified)

---

## 1. Omniston SDK (Swap Aggregation)

### Overview
- Cross-DEX liquidity aggregation on TON
- Automatically finds optimal swap routes across multiple DEXs
- Real-time quotes via WebSocket
- Ready-to-send transaction objects

### Node.js SDK
```bash
npm install @ston-fi/omniston-sdk
```

```typescript
import { Omniston } from '@ston-fi/omniston-sdk';

const omniston = new Omniston({
  apiUrl: 'wss://omni-ws.ston.fi'
});

omniston.requestForQuote({
  // quote parameters
}).subscribe((quoteEvent) => {
  // handle quote updates
});
```

**Features:**
- RxJS Observable-based API
- Comprehensive error handling
- Best Price Discovery
- Multi-source Aggregation
- Real-time Quotes via WebSocket
- Transaction Building

### React SDK
```bash
npm install @ston-fi/omniston-sdk-react
```

```tsx
import { useRfq } from '@ston-fi/omniston-sdk-react';

function SwapComponent() {
  const { data: quote, isLoading, error } = useRfq({
    // quote parameters
  });
  // ... component logic
}
```

**Features:**
- TanStack Query integration
- Transaction building and sending
- Wallet connection support

**Docs:** https://docs.ston.fi/developer-section/omniston/sdk

---

## 2. Omniston Widget (Embeddable Swap UI)

### Overview
- Ready-to-use swap interface for your app/website
- Lightweight CDN-hosted bundle
- Earn referral fees (0.01%-1%) on every swap
- Fully customizable theme via CSS custom properties
- Two TON Connect modes: standalone and integrated

### Option A: CDN (no build)
```html
<script src="https://swap.ston.fi/widget/v0/index.js"></script>

<div id="omniston-widget-container" style="max-width: 420px; margin: 0 auto;"></div>

<script>
  const widget = new window.OmnistonWidget({
    tonconnect: {
      type: 'standalone',
      options: { manifestUrl: 'https://YOUR_APP_HOST/tonconnect-manifest.json' },
    },
    widget: {
      // Optional: defaultBidAsset, defaultAskAsset
    },
  });
  widget.mount(document.querySelector("#omniston-widget-container"));
</script>
```

### Option B: NPM (React with TON Connect)
```bash
npm install @ston-fi/omniston-widget-loader
```

```tsx
import { useEffect, useRef } from 'react';
import { TonConnectUIProvider, TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import omnistonWidgetLoader, { type OmnistonWidget } from '@ston-fi/omniston-widget-loader';

function SwapWidget() {
  const [tonconnect] = useTonConnectUI();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<OmnistonWidget | null>(null);

  useEffect(() => {
    let isMounted = true;
    omnistonWidgetLoader.load().then((OmnistonWidgetConstructor) => {
      if (!isMounted || !containerRef.current || !tonconnect) return;
      widgetRef.current = new OmnistonWidgetConstructor({
        tonconnect: { type: 'integrated', instance: tonconnect },
        widget: {
          defaultBidAsset: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // TON
          defaultAskAsset: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO', // STON
        },
      });
      widgetRef.current.mount(containerRef.current);
    });
    return () => { isMounted = false; widgetRef.current?.unmount(); };
  }, [tonconnect]);

  return <div ref={containerRef} style={{ width: '100%', maxWidth: 500, margin: '0 auto' }} />;
}
```

**Referral fees:** Set `referrerAddress` and `referrerFeeBps` to earn 0.01%-1% per swap.
**Docs:** https://docs.ston.fi/developer-section/widget

---

## 3. DEX SDK (@ston-fi/sdk)

### Overview
- Build payloads for swap and liquidity transactions on STON.fi DEX
- Supports TON and Jetton tokens
- Works with TonConnect for wallet integration

### Installation
```bash
npm install @ston-fi/sdk @ston-fi/api @tonconnect/ui-react @ton/ton
```

### Key Features
- Swap transaction building (TON <-> Jetton, Jetton <-> Jetton)
- Liquidity provision (provide & exit pools)
- Router contract interaction
- pTON proxy support

### Usage Example (Liquidity)
```typescript
import { dexFactory } from '@ston-fi/sdk';
import { TonClient } from '@ton/ton';

const tonApiClient = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  apiKey: import.meta.env.VITE_TON_API_KEY,
});

// Build liquidity provision transaction
const { Router, pTON } = dexFactory(routerInfo);
const router = tonApiClient.open(Router.create(routerInfo.address));

const txParams = await router.getProvideLiquidityTonTxParams({
  userWalletAddress: walletAddress,
  minLpOut: simulation.minLpUnits,
  sendAmount: sendAmount,
  otherTokenAddress: otherTokenAddress,
  proxyTon: pTon,
});
```

---

## 4. REST API (@ston-fi/api)

### Overview
- RESTful interface for programmatic DEX access
- No usage limits currently
- TypeScript SDK package available

### Features
- Token data & asset queries
- Pool information
- Pricing & analytics
- Liquidity provision simulation
- Referral fee endpoints

### Key Endpoints
- `GET /v1/wallets/{address}/fee_vaults` - Referral fee vaults for DEX v2
- `GET /v1/stats/fee_accruals` - Per-swap referral fee accruals
- `GET /v1/stats/fee_withdrawals` - DEX v2 vault withdrawals
- `GET /v1/stats/fees` - Aggregated referral fee stats

### Usage
```typescript
import { StonApiClient, AssetTag } from '@ston-fi/api';

const stonApiClient = new StonApiClient();

// Fetch liquid assets
const assets = await stonApiClient.queryAssets({
  condition: `${AssetTag.LiquidityVeryHigh} | ${AssetTag.LiquidityHigh} | ${AssetTag.LiquidityMedium}`,
});

// Simulate liquidity provision
const simulation = await stonApiClient.simulateLiquidityProvision({
  provisionType: 'Balanced',
  tokenA: tokenA.contractAddress,
  tokenB: tokenB.contractAddress,
  tokenAUnits: toBaseUnits(amountA, tokenA?.meta?.decimals),
  poolAddress: pool.address,
  slippageTolerance: '0.001',
  walletAddress,
});

// Get pools by asset pair
const pools = await stonApiClient.getPoolsByAssetPair({
  asset0Address: tokenA.contractAddress,
  asset1Address: tokenB.contractAddress,
});
```

**Docs:** https://docs.ston.fi/developer-section/dex/api
**API Viewer:** Available at https://docs.ston.fi/developer-section/dex/api

---

## 5. Liquidity Guide

### Quickstart: Liquidity Providing (React)
- Full React app tutorial: connect wallet, fetch tokens, simulate & execute liquidity provision
- Uses `@ston-fi/sdk`, `@ston-fi/api`, `@tonconnect/ui-react`, `@ton/ton`
- Demo app: https://github.com/mrruby/stonfi-liquidity-app
- **Docs:** https://docs.ston.fi/developer-section/quickstart/liquidity

---

## NPM Packages Summary

| Package | Purpose |
|---------|---------|
| `@ston-fi/omniston-sdk` | Omniston swap aggregation (Node.js) |
| `@ston-fi/omniston-sdk-react` | Omniston React hooks (frontend) |
| `@ston-fi/omniston-widget-loader` | Embeddable swap widget (NPM loader) |
| `@ston-fi/sdk` | DEX SDK (swap & liquidity transactions) |
| `@ston-fi/api` | REST API client (data, simulation, analytics) |
| `@tonconnect/ui-react` | TON wallet connection (React) |
| `@ton/ton` | TON blockchain client |

---

## Environment Setup

1. **Code Editor**: Download Cursor or Visual Studio Code
2. **GitHub**: Create account and project repository
3. **Vercel**: Sign up for live URL deployment
4. **AI Agents**: Connect Codex, Claude, GitHub Copilot, or Bolt to your editor
   - Or use AI dev platforms: Replit, Lovable
   - Cursor & VS Code also have built-in AI features

### Project Setup Steps
1. Create a folder anywhere
2. Open VS Code / Cursor
3. Click File > Open Folder > select that folder
4. Open terminal in VS Code
5. Connect your AI agent to the project folder

---

## TON Ecosystem

- **TON Blockchain**: Telegram-native L1 blockchain for scalable, fast & low-cost transactions
- **STON.fi**: AMM protocol on TON - pools, swaps & liquidity. Swaps aggregated using Omniston for best routed prices
- **Tonstakers**: Liquid staking on TON
- **Wallets**: Tonkeeper, TON Space
- **Smart Contracts**: FunC / Tact languages
- **SDK**: @ton/ton (TypeScript)

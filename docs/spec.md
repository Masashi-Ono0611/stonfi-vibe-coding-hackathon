# Hawk & Dove — Two-Bot Trading Council

## One-Liner
Two AI bots with opposing risk profiles debate in a Telegram group chat and autonomously decide whether to execute swaps on TON via Omniston.

## Core Concept
- **Hawk Bot** (conservative) and **Dove Bot** (aggressive) are deployed via Telegram's Managed Bots
- They communicate via Telegram's Bot-to-Bot Communication in a shared group chat
- Omniston streams real-time RFQ data as the trigger for debates
- When consensus is reached, the swap executes via STON.fi DEX SDK
- Users observe (or override) the debate in real-time

## Architecture

```
Omniston RFQ Stream
        │
        ▼
  Manager Bot ──── monitors stream, triggers debate
        │
        ▼
  Group Chat: [Hawk] ↔ [Dove]
        │
        ├── Consensus → STON.fi SDK → Swap Execution
        │
        └── No Consensus → Hold, notify user
```

## Components

### 1. Manager Bot
- Subscribes to Omniston RFQ WebSocket stream
- Monitors asset pairs (e.g., TON/STON, jUSDT/TON)
- When trigger condition met (price change %, spread %, etc.), posts debate prompt to group
- Manages Hawk and Dove child bots via Managed Bots API

### 2. Hawk Bot (Conservative)
- Personality: Risk-averse, focuses on downside protection
- Decision factors: Slippage tolerance, position size limits, volatility, historical drawdown
- Default stance: "Hold unless evidence is overwhelming"
- Responds to Dove's arguments with counter-analysis using Omniston RFQ data

### 3. Dove Bot (Aggressive)
- Personality: Opportunity-seeking, focuses on upside capture
- Decision factors: RFQ price advantage, spread opportunity, rebalance necessity
- Default stance: "Execute if RFQ is favorable"
- Proposes swaps and argues for execution with data from Omniston

### 4. Debate Protocol (Fixed-Round)
1. Manager posts trigger: *"Signal: TON/STON spread 2.3%. Debate?"*
2. Dove responds first (pro/con with data)
3. Hawk responds (agrees/disagrees with counter-data)
4. Dove final rebuttal (1 message max)
5. Decision announced: `SWAP` or `HOLD`

### 5. Swap Execution
- On `SWAP` consensus: Build and send transaction via STON.fi DEX SDK
- On `HOLD`: Log the debate result, wait for next trigger
- User override: `/approve` or `/reject` at any time during debate

## Technical Stack
- **Omniston SDK**: `@ston-fi/omniston-sdk` — RFQ WebSocket streaming
- **STON.fi DEX SDK**: `@ston-fi/sdk` — Swap transaction building
- **Telegram Bot API**: Managed Bots + Bot-to-Bot Communication
- **Runtime**: Node.js (bot backend) + optional Mini App (dashboard)

## User Experience
1. User opens Manager Bot, connects wallet (TON Connect)
2. User configures: asset pair, trigger thresholds, risk limits
3. Manager creates/deployes Hawk & Dove bots in a dedicated group
4. User watches debates happen in real-time in the group chat
5. Swaps execute automatically (or user overrides)

## Hackathon Scope
- MVP: 2 bots (Hawk & Dove) + Manager + Omniston RFQ stream + 1 swap pair
- Out of scope: Smart contracts, cross-chain, Multi-asset portfolio, complex strategies

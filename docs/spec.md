# Hawk & Dove — Moltbook-style Agents Debate, Then Swap

## One-Liner
Two AI bots with opposing risk profiles debate in a Telegram group chat and autonomously decide whether to execute swaps on TON via Omniston.

## Core Concept
- **Hawk Bot** (conservative) and **Dove Bot** (aggressive) debate in a shared group chat via Telegram's Bot-to-Bot Communication
- A **Manager Bot** monitors Omniston RFQ stream and provides live data for debates
- After a fixed-round debate, the Manager announces `SWAP` or `HOLD`
- Users observe the debate in real-time and can override

## Architecture

```
/debate command (with live Omniston RFQ data)
        │
        ▼
  Manager Bot ──── triggers debate, announces decision
        │
        ▼
  Group Chat: [Manager] → [Dove] → [Hawk] → [Dove]
                                        │
                                        ▼
                              Manager announces result
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
                    SWAP (consensus)             HOLD (no consensus)
                          │                           │
                    STON.fi SDK                Log & wait
                    → execute swap
```

## Components

### 1. Manager Bot
- Subscribes to Omniston RFQ WebSocket stream for live quote data
- Monitors asset pairs (e.g., TON/STON, jUSDT/TON)
- User sends `/debate` to trigger a debate with current RFQ data
- After debate concludes, announces final decision (`SWAP` or `HOLD`)
- Executes swap via STON.fi DEX SDK on `SWAP` consensus
- Bot setup: 3 bots created manually via BotFather for MVP (Managed Bots API as future enhancement)

### 2. Hawk Bot (Conservative)
- Personality: Risk-averse, focuses on downside protection
- Decision factors: Slippage tolerance, position size limits, volatility
- Default stance: "Hold unless evidence is overwhelming"
- Receives RFQ data from Manager's trigger, responds with counter-analysis

### 3. Dove Bot (Aggressive)
- Personality: Opportunity-seeking, focuses on upside capture
- Decision factors: RFQ price advantage, market opportunity
- Default stance: "Execute if RFQ is favorable"
- Receives RFQ data from Manager's trigger, proposes swap with data
- Delivers final rebuttal after Hawk's counter-argument

### 4. Debate Protocol (Fixed-Round)

| Round | Speaker | Action |
|-------|---------|--------|
| 0 | Manager | Posts trigger with RFQ data: *"Signal: TON/STON — 1.00 TON → 4.19 STON. Price: 4.190000. Debate?"* |
| 1 | Dove | Responds with SWAP recommendation + data |
| 2 | Hawk | Counter-argues with HOLD stance + risk data |
| 3 | Dove | Final rebuttal (SWAP or concedes to HOLD) |
| 4 | Manager | Announces final decision |

**Termination**: Each bot has a response counter (Hawk: max 1, Dove: max 2). After all rounds complete, no further automatic responses.

**Decision logic**: Manager parses Dove's final message. If Dove says SWAP → `SWAP`. If Dove concedes to HOLD → `HOLD`.

### 5. Swap Execution
- On `SWAP`: Manager builds and sends transaction via STON.fi DEX SDK
- On `HOLD`: Log the debate, wait for next trigger
- User override: `/approve` or `/reject` at any time during debate

## Technical Stack
- **Omniston SDK**: `@ston-fi/omniston-sdk` — RFQ WebSocket streaming (live data for debates)
- **STON.fi DEX SDK**: `@ston-fi/sdk` — Swap transaction building
- **Telegram Bot API**: Bot-to-Bot Communication (grammy)
- **Runtime**: Node.js (bot backend) + optional Mini App (dashboard)

## Feasibility Test Results

| # | Test | Result |
|---|------|--------|
| 1 | Bot receives other bot's message in group | Dove←Hawk ✅, Hawk←Dove ✅ |
| 2 | Reply received by target bot | Hawk→Dove ✅, Dove→Hawk ✅ |
| 3 | Full debate completes in <10s | ~2s ✅ |
| 4 | Loop prevention (terminates after N rounds) | Hawk 1 resp, Dove 2 resp ✅ |

See [`feasibility-test/SPEC.md`](../feasibility-test/SPEC.md) for full test specification.

## User Experience
1. User opens Manager Bot in Telegram
2. User configures: asset pair, risk limits
3. Manager Bot adds user to a dedicated group with Hawk & Dove
4. User sends `/debate` to trigger a debate with live Omniston data
5. User watches debate unfold in real-time
6. Manager announces decision, swap executes on consensus

## Hackathon Scope
- MVP: 3 bots (Manager, Hawk, Dove) + Omniston RFQ data + /debate trigger + 1 swap pair
- Out of scope: Smart contracts, cross-chain, multi-asset portfolio, Managed Bots API, Mini App dashboard

## Next Steps
1. Add LLM prompts for natural language debate (replace template responses)
3. Add Manager decision announcement after debate concludes
4. Connect STON.fi DEX SDK for swap execution on consensus

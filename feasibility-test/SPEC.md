# Feasibility Test: Bot-to-Bot Communication

## Core Question
**Can two Telegram bots exchange messages in a group chat and reach a structured decision?**

This test validates the foundational technology before building Hawk & Dove.

## What We're Testing

| # | Hypothesis | Pass Criteria |
|---|-----------|---------------|
| 1 | A bot can send a message that another bot receives in a group chat | Bot B receives Bot A's message as an Update |
| 2 | Bot B can reply to Bot A's message and Bot A receives the reply | Bot A receives Bot B's reply as an Update |
| 3 | Multiple message exchanges complete within a reasonable time | Full debate (3-4 messages) completes in <10s |
| 4 | Loop prevention works (bots don't infinitely reply) | Conversation terminates after N rounds |

## Out of Scope for This Test
- Omniston integration
- Swap execution
- LLM/AI — bots use fixed template responses
- Managed Bots (we create bots manually via BotFather)
- Mini App / wallet connection

## Setup

### Bot Creation (Manual via @BotFather)
1. Create 3 bots:
   - `@HawkTestBot` — Bot A (conservative responder)
   - `@DoveTestBot` — Bot B (aggressive responder)
   - `@ManagerTestBot` — Bot C (debate initiator)
2. For ALL 3 bots, enable: BotFather > Bot Settings > **"Bot-to-Bot Communication Mode"**
3. Add all 3 bots to a **group chat** as **admins** (admins receive all messages)

### Environment
```
BOT_A_TOKEN=...  # @HawkTestBot
BOT_B_TOKEN=...  # @DoveTestBot
BOT_C_TOKEN=...  # @ManagerTestBot
GROUP_CHAT_ID=-100xxxxxxxxxx
```

## Implementation Plan

### Step 1: Bot Skeleton
- Single Node.js process running 3 bot instances (grammy or node-telegram-bot-api)
- Each bot polls for updates via getUpdates (long polling)
- Log all received updates to console

### Step 2: Trigger Test
- Manager bot sends a message to the group: *"Test trigger: Should we swap TON for STON? Current price: 1 TON = 2.5 STON"*
- Verify: Both Hawk and Dove receive this message

### Step 3: Debate Test
- Dove responds to Manager's trigger: *"RFQ shows favorable rate. I recommend SWAP."*
- Hawk responds to Dove: *"Slippage too high. I recommend HOLD."*
- Dove replies to Hawk: *"Spread is within 1% tolerance. Final: SWAP."*
- Verify: All messages are received by the intended bots

### Step 4: Termination Test
- After Dove's final message, no further automatic responses
- Implement a simple counter: max 2 responses per bot per debate round

## Expected Output
```
[Manager] Signal: TON/STON spread 2.3%. Debate?
[Hawk]   ← receives Manager's message (Test #1)
[Dove]   ← receives Manager's message (Test #1)
[Dove]   → "RFQ favorable. SWAP."
[Hawk]   ← receives Dove's message (Test #2)
[Hawk]   → "Slippage risk. HOLD."
[Dove]   ← receives Hawk's message (Test #2)
[Dove]   → "Spread acceptable. Final: SWAP."
[Manager] ← both bots responded, debate complete (Test #3)
          → "Decision: SWAP" (Test #4: no further messages)
```

## Success = All 4 Tests Pass
If any test fails, the core premise of Hawk & Dove is not viable and we need an alternative approach.

## File Structure
```
feasibility-test/
  package.json
  tsconfig.json
  .env.example
  src/
    index.ts          # Entry point, starts all 3 bots
    bots/
      manager.ts      # Sends trigger message
      hawk.ts         # Conservative responder
      dove.ts         # Aggressive responder
    shared/
      types.ts        # Message types, debate state
      config.ts       # Bot tokens, group ID from env
```

## Next Step After Test Passes
- Integrate Omniston RFQ stream as trigger source (replace hardcoded trigger)
- Add LLM prompts for natural language debate (replace template responses)
- Connect STON.fi DEX SDK for swap execution on consensus

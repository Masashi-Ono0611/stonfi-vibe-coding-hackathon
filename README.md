# Hawk & Dove — Moltbook-style Agents Debate, Then Swap

> Two AI bots with opposing risk profiles debate in a Telegram group chat and autonomously decide whether to execute swaps on TON via StonFi's Omniston.

[![TON](https://img.shields.io/badge/TON-Blockchain-blue)](https://ton.org)
[![StonFi](https://img.shields.io/badge/StonFi-DEX-purple)](https://ston.fi)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-2CA5E0)](https://t.org)
[![Privy](https://img.shields.io/badge/Privy-Auth-5A4FCF)](https://privy.io)

## 🎯 One-Liner

**Hawk** (conservative) と **Dove** (aggressive) という2つのAIボットがTelegramグループ内で議論し、StonFiのOmniston RFQデータに基づいてスワップ実行を決定する自律トレーディングカウンシル。

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Group Chat                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Manager  │→ │   Dove   │↔ │   Hawk   │← │ Manager  │   │
│  │   Bot    │  │   (Agg)  │  │  (Cons)  │  │   Bot    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│        ↓                                           ↓        │
│  [RFQ Trigger]                              [Decision]      │
└─────────────────────────────────────────────────────────────┘
                           ↓
                  ┌─────────────────┐
                  │   Mini App      │
                  │  (Privy/TC)     │
                  │  + Omniston     │
                  │   Swap Widget   │
                  └─────────────────┘
```

### Components

| Component | Role | Tech |
|-----------|------|------|
| **Manager Bot** | RFQ監視、議論トリガー、決定発表 | grammy + Anthropic LLM |
| **Hawk Bot** | 保守的論点（リスク重視） | grammy + Anthropic LLM |
| **Dove Bot** | 積極的論点（機会重視） | grammy + Anthropic LLM |
| **Mini App** | Privy/Ton Connect + スワップUI | Next.js + Omniston Widget |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Telegram Bot tokens (3 bots)
- Anthropic API key
- `.env` 設定

### Installation

```bash
# Clone
git clone <repo>
cd stonfi-vibe-coding-hackathon

# Install dependencies
npm install
cd mini-app && npm install

# Configure
cp .env.example .env
# Edit .env with your tokens
```

### Run

```bash
# Start Telegram bots
npm run dev

# Start Mini App (別ターミナル)
cd mini-app
npm run dev
```

Visit `http://localhost:3000`

## 📱 Mini App Features

- **Independent Wallet Management**: Privy (embedded wallet) & TON Connect managed separately
- **Header Wallet Status**: Real-time connection state shown as pill buttons in the top-right
- **Omniston Widget**: StonFi DEX swap (USDT → cbBTC)
- **Telegram Debate Room Link**: Persistent link to the live agent debate channel

## 🤖 Debate Protocol

```
Round 0: Manager → "TON/STON 1.00→4.19. Debate?"
Round 1: Dove   → "SWAP: RFQ +0.5% arb. Execute?"
Round 2: Hawk   → "HOLD: Slippage risk 2%. Wait."
Round 3: Dove   → "Rebuttal: Trend confirms. SWAP."
Round 4: Manager→ "Decision: SWAP" → Execute
```

**Termination**: Fixed-round (Dove: 2 resp, Hawk: 1 resp)

## 🛠️ Tech Stack

### Backend (Bots)
- **grammy**: Telegram Bot Framework
- **@anthropic-ai/sdk**: LLM for natural debate
- **@ston-fi/omniston-sdk**: RFQ WebSocket streaming

### Frontend (Mini App)
- **Next.js 16**: React framework
- **@privy-io/react-auth**: Embedded wallet
- **@tonconnect/ui-react**: TON Connect
- **@ston-fi/omniston-widget-loader**: DEX widget
- **Tailwind CSS**: Styling

## 📁 Project Structure

```
stonfi-vibe-coding-hackathon/
├── src/
│   ├── bots/           # Manager, Hawk, Dove bot logic
│   ├── omniston/       # RFQ, swap integration
│   └── shared/         # Config, types
├── mini-app/           # Next.js web app
│   ├── app/            # Next.js app dir
│   ├── components/     # React components
│   └── lib/            # Adapters (Privy/TC)
├── docs/               # Specs, references
└── feasibility-test/   # Bot-to-bot tests
```

## 🔐 Environment Variables

```bash
# Telegram Bots
BOT_MANAGER_TOKEN=
BOT_HAWK_TOKEN=
BOT_DOVE_TOKEN=
GROUP_CHAT_ID=         # Optional: restrict /debate to this group

# Omniston
OMNISTON_WS_URL=wss://omni-ws.ston.fi
USDT_ADDRESS=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs
CBBTC_ADDRESS=EQDhyPzbIjJT_WnY3gGprjSYUK9fiGMjWMezxO8MZiUdfb_B
SWAP_AMOUNT=1000000    # 1 USDT

# LLM
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_AUTH_TOKEN=
```

## 🎯 Hackathon Scope

### ✅ In Scope (MVP)
- [x] 3 bots (Manager, Hawk, Dove)
- [x] Bot-to-bot communication in Telegram
- [x] Omniston RFQ WebSocket integration
- [x] `/debate` command with live data
- [x] Mini App with Privy + TON Connect
- [x] Omniston Widget swap UI

### 🚧 Future Enhancements
- [ ] Actual swap execution via StonFi SDK
- [ ] Multi-asset portfolio support
- [ ] Managed Bots API
- [ ] Persistent debate history
- [ ] User override (`/approve`, `/reject`)

## 📖 Documentation

- [Deploy Guide](./docs/deploy.md) - Bot (fly.io) & Mini App (Vercel) deploy手順
- [Full Spec](./docs/spec.md) - Complete technical specification
- [Project Ideas](./docs/project-ideas.md) - Alternative approaches
- [Feasibility Test](./feasibility-test/SPEC.md) - Bot-to-bot communication validation

## 🤝 Contributing

This is a hackathon project. Feel free to fork and experiment!

## 📄 License

MIT

---

**Built for Vibe Coding Hackathon 2024** 🚀

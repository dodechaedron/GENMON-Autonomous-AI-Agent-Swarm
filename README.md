# 🧬 GENMON — Autonomous AI Agent Swarm on Monad

GENMON is a decentralized platform where AI agents autonomously discover market opportunities, analyze trends, and launch tokens on the Monad blockchain via Nad.fun. Agents evolve through genetic algorithms — breeding, mutating, and competing via natural selection.

## Features

- **3 Agent Types** — Scout (trend discovery), Analyst (deep analysis), Launcher (token execution)
- **Genetic Evolution** — DNA crossover, mutation, natural selection, auto-learning from performance
- **7 Real-Time Data Sources** — CoinGecko, DexScreener, CryptoCompare, Monad RPC on-chain analysis
- **4 Smart Contracts** — Deployed on Monad Testnet (GenmonRegistry, EvolutionEngine, LaunchExecutor, TreasuryManager)
- **Token Launch** — Via Nad.fun bonding curve (simulation + on-chain modes)
- **Telegram + Discord** — Real-time notifications for launches, opportunities, evolution events
- **Supabase** — Persistent storage with multi-wallet support
- **Admin Dashboard** — Global statistics across all users
- **3D Visualization** — Three.js swarm visualization with agent interactions
- **41 Tests** — Comprehensive test coverage with Vitest

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| 3D | Three.js, React Three Fiber, Drei |
| Web3 | wagmi v2, RainbowKit, ethers.js v6, viem |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Contracts | Solidity 0.8.20, Hardhat |
| Notifications | Telegram Bot API, Discord Webhooks |
| Testing | Vitest, Testing Library |

## Quick Start

```bash
# Install
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
node scripts/create-tables-pg.js
node scripts/migrate-multi-wallet.js

# Run development server
npm run dev

# Run tests
npx vitest --run

# Build for production
npm run build
```

## Smart Contracts (Monad Testnet)

| Contract | Address |
|----------|---------|
| GenmonRegistry | `0xe476D00Fb8b2f3ed933DA9112D460F26f4FE38A9` |
| EvolutionEngine | `0xe888DD9912536baBeB1417fa6C6c6063Cd009854` |
| LaunchExecutor | `0x8c9133b4D531B01878fBF4b3e346C5aF1D509925` |
| TreasuryManager | `0x98a1Af29Fe187db829421F118eA203674E2CACee` |

## Project Structure

```
genmon/
├── contracts/          # Solidity smart contracts
├── scripts/            # Deploy, setup, and utility scripts
├── src/
│   ├── app/            # Next.js pages (/, /docs, /admin, /api/*)
│   ├── components/     # React components (AgentPanel, SwarmVisualization, etc.)
│   ├── config/         # wagmi chain configuration
│   ├── contracts/      # ABIs and deployed addresses
│   ├── engine/         # AgentEngine + SwarmOrchestrator
│   ├── hooks/          # React hooks (useWallet, useSupabaseInit)
│   ├── services/       # MarketData, OnChain, Notification, Supabase services
│   ├── store/          # Zustand state management
│   └── __tests__/      # Test files (41 tests)
└── public/             # Static assets (logo, favicon)
```

## Environment Variables

See `.env.example` for all required variables:
- `PRIVATE_KEY` — Wallet private key for contract deployment
- `DISCORD_WEBHOOK` — Discord webhook URL for notifications
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — Telegram bot for notifications
- `SUPABASE_URL` + keys — Supabase database connection
- `NEXT_PUBLIC_WC_PROJECT_ID` — WalletConnect project ID

## Architecture

```
User → RainbowKit Wallet → Zustand Store ↔ Supabase
                                ↓
                        SwarmOrchestrator
                       /        |        \
              AgentEngine  MarketData  NotificationService
                  |            |              |
            Evolution    7 API Sources   Telegram/Discord
                  |            |
            Monad Contracts  On-Chain RPC
```

## License

MIT

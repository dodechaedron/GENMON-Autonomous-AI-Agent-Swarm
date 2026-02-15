# GENMON — Moltiverse Hackathon Submission

## Track: Agent Track

## Project Name
GENMON — Autonomous AI Agent Swarm for Monad

## One-Liner
An autonomous swarm of AI agents that evolve, collaborate, and launch meme tokens on Monad via Nad.fun using real-time market intelligence.

## Live Demo
https://genmon-delta.vercel.app

## GitHub Repository
https://github.com/dodechaedron/GENMON-Autonomous-AI-Agent-Swarm

## Documentation
https://genmon-delta.vercel.app/docs

## Description

GENMON is an autonomous AI agent swarm platform built on Monad. It creates a self-evolving ecosystem of AI agents — Scouts, Analysts, and Launchers — that work together to discover trending narratives, analyze market conditions, and launch meme tokens through Nad.fun.

### What Makes GENMON Unique

**Biological Evolution on Blockchain**
Each agent has DNA traits (risk tolerance, creativity, social savvy, analytical depth) stored on-chain. Agents breed, mutate, and evolve through natural selection — successful agents reproduce while underperformers die off. This creates an ever-improving swarm that adapts to market conditions.

**Three-Agent Consensus System**
No token launches without swarm consensus. A Scout discovers opportunities from 7+ real-time data sources, an Analyst evaluates risk using on-chain metrics, and a Launcher executes — requiring 2/3 approval before any action.

**Real Market Intelligence**
- CoinGecko trending coins & categories
- DexScreener new pairs & volume data
- CryptoCompare news sentiment
- Monad RPC on-chain analysis (gas, blocks, whale detection)
- Social sentiment from multiple platforms

**Smart Contracts on Monad Testnet**
4 audited contracts deployed:
- GenmonRegistry — Agent creation with DNA, staking, authorized caller pattern
- EvolutionEngine — Breeding with crossover genetics and mutation
- LaunchExecutor — Proposal voting and Nad.fun integration
- TreasuryManager — MON staking with reward distribution

### Tech Stack
- **Frontend**: Next.js 14, React 18, TailwindCSS, Three.js (3D visualization)
- **Blockchain**: Monad (Testnet + Mainnet), Solidity 0.8.20, Hardhat
- **Wallet**: RainbowKit + wagmi v2 + WalletConnect
- **Backend**: Supabase (PostgreSQL), Next.js API routes
- **Notifications**: Telegram bot + Discord webhooks
- **Data**: CoinGecko, DexScreener, CryptoCompare, Monad RPC

### Contract Addresses (Monad Testnet)
- GenmonRegistry: `0xe476D00Fb8b2f3ed933DA9112D460F26f4FE38A9`
- EvolutionEngine: `0xe888DD9912536baBeB1417fa6C6c6063Cd009854`
- LaunchExecutor: `0x8c9133b4D531B01878fBF4b3e346C5aF1D509925`
- TreasuryManager: `0x98a1Af29Fe187db829421F118eA203674E2CACee`

### Key Features
1. 3D swarm visualization with real-time agent activity
2. Agent creation with customizable DNA traits
3. Breeding system with genetic crossover and mutation
4. Real-time market dashboard with live data
5. Multi-wallet support — each user has isolated agents
6. Telegram/Discord notifications for launches and opportunities
7. Admin dashboard for global monitoring
8. Security-audited smart contracts
9. Natural selection — agents that fail too much die automatically
10. Auto-strategy learning from past performance

### What's Original
Everything in this repository was built from scratch for this hackathon. The agent evolution system, swarm consensus mechanism, DNA-based breeding, and the integration between AI decision-making and Monad smart contracts are all original innovations.

### Team
Solo developer

---

*Built for Moltiverse Hackathon by Nad.fun & Monad*

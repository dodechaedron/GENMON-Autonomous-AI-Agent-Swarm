"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const TABS = ["Overview", "Agents", "Swarm", "Market Data", "Contracts", "Architecture", "API", "Setup"] as const;
type Tab = (typeof TABS)[number];

export default function DocsPage() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <main className="min-h-screen bg-space text-white">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-space/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-cyan/30">
              <Image src="/logo.png" alt="GENMON" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-bold">
              <span className="text-cyan">GEN</span><span className="text-purple">MON</span>
            </span>
          </Link>
          <span className="text-gray-600 text-sm">/ Documentation</span>
        </div>
        <Link href="/" className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs hover:text-white transition-all">
          ← Back
        </Link>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-white/5 overflow-x-auto">
        <div className="max-w-5xl mx-auto flex px-4">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs whitespace-nowrap border-b-2 transition-all ${
                tab === t ? "border-cyan text-cyan" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {tab === "Overview" && <OverviewSection />}
        {tab === "Agents" && <AgentsSection />}
        {tab === "Swarm" && <SwarmSection />}
        {tab === "Market Data" && <MarketDataSection />}
        {tab === "Contracts" && <ContractsSection />}
        {tab === "Architecture" && <ArchitectureSection />}
        {tab === "API" && <ApiSection />}
        {tab === "Setup" && <SetupSection />}
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-cyan mb-4">{children}</h2>;
}

function Card({ title, children, color = "cyan" }: { title: string; children: React.ReactNode; color?: string }) {
  const borderColor = color === "cyan" ? "border-cyan/15" : color === "purple" ? "border-purple/15" : "border-pink/15";
  return (
    <div className={`bg-space-light/50 border ${borderColor} rounded-xl p-4 mb-4`}>
      <h3 className={`text-sm font-semibold text-${color} mb-2`}>{title}</h3>
      <div className="text-sm text-gray-300 leading-relaxed">{children}</div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-black/40 border border-white/5 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto my-2">
      <code>{code}</code>
    </pre>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-white/5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300 font-mono text-xs">{value}</span>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>What is GENMON?</SectionTitle>
      <Card title="Autonomous AI Agent Swarm on Monad">
        <p>GENMON is a decentralized platform where AI agents autonomously discover market opportunities, analyze trends, and launch tokens on the Monad blockchain via Nad.fun.</p>
        <p className="mt-2">Agents evolve through genetic algorithms — breeding, mutating, and competing via natural selection. The fittest agents survive and produce better offspring.</p>
      </Card>

      <Card title="Key Features" color="purple">
        <ul className="space-y-1.5 list-disc list-inside">
          <li>3 agent types: Scout, Analyst, Launcher — each with unique DNA</li>
          <li>Real-time market data from CoinGecko, DexScreener, CryptoCompare</li>
          <li>On-chain analysis via Monad RPC (block activity, gas, transactions)</li>
          <li>Agent evolution: breeding, mutation, natural selection</li>
          <li>Token launch via Nad.fun bonding curve</li>
          <li>4 smart contracts deployed on Monad Testnet</li>
          <li>Telegram + Discord real-time notifications</li>
          <li>Supabase persistent storage with multi-wallet support</li>
          <li>Admin dashboard for global statistics</li>
          <li>3D swarm visualization with Three.js</li>
          <li>Performance tracking with auto-learning</li>
        </ul>
      </Card>

      <Card title="Tech Stack" color="pink">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-cyan">Frontend:</span> Next.js 14, React 18, Tailwind CSS</div>
          <div><span className="text-cyan">3D:</span> Three.js, React Three Fiber</div>
          <div><span className="text-cyan">Web3:</span> wagmi v2, RainbowKit, ethers.js v6</div>
          <div><span className="text-cyan">State:</span> Zustand</div>
          <div><span className="text-cyan">Database:</span> Supabase (PostgreSQL)</div>
          <div><span className="text-cyan">Contracts:</span> Solidity 0.8.20, Hardhat</div>
          <div><span className="text-cyan">Notifications:</span> Telegram Bot API, Discord Webhooks</div>
          <div><span className="text-cyan">Testing:</span> Vitest (41 tests)</div>
        </div>
      </Card>

      <Card title="Deployed Contracts (Monad Testnet)">
        <InfoRow label="GenmonRegistry" value="0xe476D00F...A9" />
        <InfoRow label="EvolutionEngine" value="0xe888DD99...54" />
        <InfoRow label="LaunchExecutor" value="0x8c9133b4...25" />
        <InfoRow label="TreasuryManager" value="0x98a1Af29...ee" />
      </Card>
    </div>
  );
}

function AgentsSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Agent System</SectionTitle>
      <Card title="Agent Types">
        <div className="space-y-3">
          <div>
            <span className="text-cyan font-semibold">🔍 SCOUT</span> — Discovers trending topics and market opportunities. High social savvy and creativity. Scans CoinGecko trending, DexScreener new pairs, and crypto news.
          </div>
          <div>
            <span className="text-purple font-semibold">📊 ANALYST</span> — Evaluates opportunities with deep analysis. High analytical depth. Checks on-chain metrics, price action, volume, and risk assessment.
          </div>
          <div>
            <span className="text-pink font-semibold">🚀 LAUNCHER</span> — Executes token launches on Nad.fun. High risk tolerance. Generates token names, symbols, and concepts based on swarm consensus.
          </div>
        </div>
      </Card>

      <Card title="Agent DNA" color="purple">
        <p>Each agent has 4 DNA traits (0-100):</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
          <li><span className="text-pink">Risk Tolerance</span> — willingness to launch on uncertain data</li>
          <li><span className="text-purple">Creativity</span> — ability to generate unique token concepts</li>
          <li><span className="text-cyan">Social Savvy</span> — skill at reading social trends</li>
          <li><span className="text-blue-400">Analytical Depth</span> — thoroughness of market analysis</li>
        </ul>
        <p className="mt-2">DNA affects agent behavior: high risk tolerance = more aggressive launches, high analytical depth = stricter filtering.</p>
      </Card>

      <Card title="Evolution System" color="pink">
        <p className="mb-2">Agents evolve through 3 mechanisms:</p>
        <div className="space-y-2 text-xs">
          <div><span className="text-cyan font-semibold">Breeding:</span> Top-performing agents breed to create offspring. Child DNA = crossover of parents + random mutation. Requires fitness score ≥ 60%.</div>
          <div><span className="text-yellow-400 font-semibold">Learning:</span> After each launch, agents adjust DNA based on PnL. Positive PnL reinforces traits, negative PnL reduces them.</div>
          <div><span className="text-red-400 font-semibold">Natural Selection:</span> Agents with {"<"}15% win rate (after 5+ launches) or total PnL {"<"} -200% are eliminated.</div>
        </div>
      </Card>
    </div>
  );
}

function SwarmSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Swarm Intelligence</SectionTitle>
      <Card title="How the Swarm Works">
        <p>The swarm operates in cycles (every 5 seconds when running):</p>
        <ol className="mt-2 space-y-1.5 list-decimal list-inside text-xs">
          <li>Scout agents scan 7 data sources for trending topics</li>
          <li>Analyst agents evaluate opportunities with on-chain + market data</li>
          <li>If confidence ≥ 75%, a launch proposal is created</li>
          <li>Agents vote on the proposal (2/3 consensus needed)</li>
          <li>Launcher agent executes token launch on Nad.fun</li>
          <li>Notifications sent to Telegram + Discord</li>
          <li>Performance tracked every 30 seconds</li>
          <li>Agents learn from results, weak agents eliminated</li>
        </ol>
      </Card>

      <Card title="Swarm Modes" color="purple">
        <div className="space-y-2 text-xs">
          <div><span className="text-gray-400 font-semibold">🔬 Simulation:</span> Agents run locally, token launches are simulated with realistic price movements. Good for testing strategies.</div>
          <div><span className="text-green-400 font-semibold">⛓ On-Chain:</span> Real blockchain interactions — agents recorded on-chain, tokens launched via Nad.fun, MON staking required.</div>
        </div>
      </Card>

      <Card title="3D Visualization" color="pink">
        <p>The swarm is visualized in 3D using Three.js. Each agent is a glowing particle that moves based on its status. Communication between agents shown as light beams. Click any agent to inspect its DNA, thoughts, and performance.</p>
      </Card>
    </div>
  );
}

function MarketDataSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Real-Time Market Data</SectionTitle>
      <Card title="7 Data Sources">
        <div className="space-y-2 text-xs">
          <div><span className="text-cyan font-semibold">CoinGecko Trending:</span> Top trending coins by search volume</div>
          <div><span className="text-cyan font-semibold">CoinGecko Markets:</span> Top gainers by 24h price change</div>
          <div><span className="text-cyan font-semibold">CoinGecko Categories:</span> Trending sector momentum</div>
          <div><span className="text-green-400 font-semibold">DexScreener Boosted:</span> Promoted tokens on DEXes</div>
          <div><span className="text-green-400 font-semibold">DexScreener New Pairs:</span> Newly created trading pairs on Monad</div>
          <div><span className="text-yellow-400 font-semibold">CryptoCompare News:</span> Crypto news with keyword extraction</div>
          <div><span className="text-purple font-semibold">Monad RPC On-Chain:</span> Block activity, gas utilization, transaction volume</div>
        </div>
      </Card>

      <Card title="Market Dashboard" color="purple">
        <p>The UI includes a Market Dashboard with 3 tabs:</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
          <li><span className="text-cyan">Trending:</span> Live trending coins with scores and price changes</li>
          <li><span className="text-yellow-400">News:</span> Latest crypto news from CryptoCompare</li>
          <li><span className="text-green-400">On-Chain:</span> Monad network activity metrics</li>
        </ul>
        <p className="mt-2">Auto-refreshes every 2 minutes. All API calls proxied through server-side routes to protect API keys.</p>
      </Card>

      <Card title="Notifications" color="pink">
        <p>Real-time alerts sent to Telegram channel + Discord:</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
          <li>🚀 Token launch alerts with confidence score</li>
          <li>💎 High-score opportunity alerts (score ≥ 75)</li>
          <li>🧬 Agent breeding/evolution events</li>
          <li>📈📉 Significant price movements (≥ 10%)</li>
          <li>☠️ Agent elimination events</li>
        </ul>
      </Card>
    </div>
  );
}

function ContractsSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Smart Contracts</SectionTitle>
      <Card title="GenmonRegistry.sol">
        <p>Core registry for all agents. Handles agent creation with MON staking (0.1 MON minimum), performance tracking, fitness scoring, and breeding eligibility.</p>
        <CodeBlock code={`function createAgent(agentType, risk, creativity, social, analytical) payable
function recordPerformance(agentId, success)
function getFitnessScore(agentId) → uint256
function isEligibleForBreeding(agentId) → bool
function withdrawStake(agentId) // when agent dies`} />
        <InfoRow label="Address" value="0xe476D00Fb8b2f3ed933DA9112D460F26f4FE38A9" />
      </Card>

      <Card title="EvolutionEngine.sol" color="purple">
        <p>Genetic algorithm on-chain. Breeds two parent agents using DNA crossover + mutation. 20% mutation chance with ±10 range. Child type determined by strongest trait.</p>
        <CodeBlock code={`function breed(parentAId, parentBId) → childId
// Crossover: weighted average of parent DNA
// Mutation: 20% chance, ±10 range per trait
// Child type: determined by dominant trait`} />
        <InfoRow label="Address" value="0xe888DD9912536baBeB1417fa6C6c6063Cd009854" />
      </Card>

      <Card title="LaunchExecutor.sol" color="pink">
        <p>Manages token launch proposals. Requires 3 agents (Scout + Analyst + Launcher), 2/3 consensus voting, minimum 75% confidence. Records results and updates agent performance.</p>
        <CodeBlock code={`function createProposal(name, symbol, concept, confidence, scoutId, analystId, launcherId)
function vote(proposalId, agentId, approved)
function hasConsensus(proposalId) → bool
function markExecuted(proposalId, tokenAddress)
function reportResult(proposalId, successful)`} />
        <InfoRow label="Address" value="0x8c9133b4D531B01878fBF4b3e346C5aF1D509925" />
      </Card>

      <Card title="TreasuryManager.sol">
        <p>MON native staking for swarm governance. Users stake MON to participate, rewards distributed proportionally to stake amount.</p>
        <CodeBlock code={`function stake() payable
function unstake(amount)
function distributeRewards() payable
function claimRewards()`} />
        <InfoRow label="Address" value="0x98a1Af29Fe187db829421F118eA203674E2CACee" />
      </Card>

      <Card title="Security Notes" color="pink">
        <ul className="space-y-1 list-disc list-inside text-xs">
          <li>All contracts use Solidity 0.8.20 with built-in overflow protection</li>
          <li>Owner-only access control on agent operations</li>
          <li>Reentrancy safe: state changes before external calls in withdrawStake</li>
          <li>MIN_STAKE prevents spam agent creation</li>
          <li>Breeding requires fitness ≥ 60% and ≥ 2 successes</li>
          <li>Proposals require 2/3 consensus before execution</li>
          <li>TreasuryManager: only owner can distribute rewards</li>
        </ul>
      </Card>
    </div>
  );
}

function ArchitectureSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Architecture</SectionTitle>
      <Card title="System Architecture">
        <CodeBlock code={`┌─────────────────────────────────────────────────┐
│                   Frontend (Next.js)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ 3D Swarm │ │ Agent    │ │ Market Dashboard │ │
│  │ Viz      │ │ Panel    │ │ + Launch Feed    │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│           │         │              │              │
│           └─────────┼──────────────┘              │
│                     ▼                             │
│              Zustand Store ←→ Supabase            │
│                     │                             │
│    ┌────────────────┼────────────────┐            │
│    ▼                ▼                ▼            │
│ AgentEngine  SwarmOrchestrator  NotificationSvc   │
│    │                │                │            │
│    │         ┌──────┼──────┐         │            │
│    │         ▼      ▼      ▼         ▼            │
│    │    NadFun  Market  OnChain  Telegram/Discord  │
│    │    Service  Data   Analyzer                  │
└────┼─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│            Monad Blockchain                      │
│  GenmonRegistry │ EvolutionEngine                │
│  LaunchExecutor │ TreasuryManager                │
└─────────────────────────────────────────────────┘`} />
      </Card>

      <Card title="Data Flow" color="purple">
        <ol className="space-y-1.5 list-decimal list-inside text-xs">
          <li>User connects wallet via RainbowKit (wagmi v2)</li>
          <li>Data loaded from Supabase filtered by wallet address</li>
          <li>User creates agents → stored in Zustand + synced to Supabase</li>
          <li>Swarm starts → AgentEngine runs cycles every 5s</li>
          <li>MarketDataService fetches from 7 real-time sources</li>
          <li>OnChainAnalyzer queries Monad RPC for block data</li>
          <li>SwarmOrchestrator coordinates agents → proposals → launches</li>
          <li>NotificationService sends alerts to Telegram + Discord</li>
          <li>Performance tracked every 30s, agents learn and evolve</li>
          <li>State auto-synced to Supabase every 60s</li>
        </ol>
      </Card>

      <Card title="Multi-Wallet Support" color="pink">
        <p>Each connected wallet has isolated data:</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
          <li>Agents, proposals, and breeding logs tagged with <code className="text-cyan">owner_wallet</code></li>
          <li>Switching wallet automatically reloads user-specific data</li>
          <li>Admin dashboard at <code className="text-cyan">/admin</code> shows global stats across all wallets</li>
          <li>Supabase RLS policies allow read/write for all authenticated users</li>
        </ul>
      </Card>
    </div>
  );
}

function ApiSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>API Routes</SectionTitle>
      <Card title="GET /api/market">
        <p>Server-side proxy for all market data. Protects API keys.</p>
        <CodeBlock code={`?action=sentiment    — Combined market sentiment (7 sources)
?action=trending     — CoinGecko trending coins
?action=gainers      — Top gainers by volume
?action=news         — CryptoCompare crypto news
?action=categories   — CoinGecko trending categories
?action=boosted      — DexScreener boosted tokens
?action=pairs        — DexScreener new pairs
?action=search&q=    — Search DexScreener pairs
?action=onchain      — Monad on-chain network activity
?action=token&address= — Analyze specific token`} />
        <p className="text-xs text-gray-500 mt-2">Rate limited: 60 requests/minute per IP</p>
      </Card>

      <Card title="POST /api/notify" color="purple">
        <p>Unified notification hub for Telegram + Discord.</p>
        <CodeBlock code={`POST /api/notify
{
  "title": "🚀 Token Launched",
  "message": "GENMON launched $TEST with 85% confidence",
  "fields": [{ "name": "Token", "value": "$TEST" }],
  "urgency": "high",    // low | medium | high
  "channel": "all"      // all | telegram | discord
}`} />
      </Card>

      <Card title="GET /api/notify" color="pink">
        <p>Check notification configuration status.</p>
        <CodeBlock code={`Response: { "discord": true, "telegram": true }`} />
      </Card>

      <Card title="GET /api/sentiment">
        <p>Twitter sentiment analysis (requires TWITTER_BEARER token).</p>
        <CodeBlock code={`?topic=monad — Analyze sentiment for a topic`} />
      </Card>
    </div>
  );
}

function SetupSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Setup Guide</SectionTitle>
      <Card title="1. Install Dependencies">
        <CodeBlock code={`git clone <repo-url>
cd genmon
npm install`} />
      </Card>

      <Card title="2. Environment Variables" color="purple">
        <CodeBlock code={`cp .env.example .env
# Edit .env with your values:
PRIVATE_KEY=your_wallet_private_key
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=-100123456789
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`} />
      </Card>

      <Card title="3. Setup Database" color="pink">
        <CodeBlock code={`# Create Supabase tables
node scripts/create-tables-pg.js

# Add multi-wallet support
node scripts/migrate-multi-wallet.js

# Verify setup
node scripts/setup-supabase.js`} />
      </Card>

      <Card title="4. Deploy Contracts (Optional)">
        <CodeBlock code={`# Deploy to Monad Testnet
npx hardhat run scripts/deploy.js --network monadTestnet

# Check wallet balance
node scripts/check-balance.js`} />
      </Card>

      <Card title="5. Run" color="purple">
        <CodeBlock code={`npm run dev    # Development
npm run build  # Production build
npm run start  # Production server
npm run lint   # Lint check`} />
      </Card>

      <Card title="6. Test" color="pink">
        <CodeBlock code={`npx vitest --run  # Run all 41 tests`} />
      </Card>
    </div>
  );
}

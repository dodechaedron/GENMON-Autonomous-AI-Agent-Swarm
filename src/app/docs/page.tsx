"use client";
import Link from "next/link";
import { useState } from "react";

const TABS = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "agents", label: "Agents", icon: "🤖" },
  { id: "swarm", label: "Swarm", icon: "🧠" },
  { id: "market", label: "Market Data", icon: "📊" },
  { id: "contracts", label: "Contracts", icon: "📜" },
  { id: "architecture", label: "Architecture", icon: "🏗️" },
  { id: "api", label: "API", icon: "⚡" },
  { id: "setup", label: "Setup", icon: "🔧" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function DocsPage() {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <main className="min-h-screen bg-[#0a0a12] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-cyan-400/30 group-hover:ring-cyan-400/60 transition-all">
                <img src="/logo.png" alt="GENMON" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-bold tracking-tight">
                <span className="text-cyan-400">GEN</span><span className="text-purple-400">MON</span>
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 text-gray-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-xs font-medium">Documentation</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://github.com/dodechaedron/GENMON-Autonomous-AI-Agent-Swarm" target="_blank" rel="noopener"
              className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/[0.08] text-gray-400 text-xs hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <Link href="/" className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/[0.08] text-gray-400 text-xs hover:text-white hover:border-white/20 transition-all">
              ←<span className="hidden sm:inline"> Back</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0 border-r border-white/[0.06] sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto py-4 px-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold px-2 mb-2">Navigation</div>
          <nav className="space-y-0.5">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                  tab === t.id
                    ? "bg-cyan-400/10 text-cyan-400 font-medium"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                }`}>
                <span className="text-sm">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="mt-6 mx-2 p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/10">
            <div className="text-[10px] text-cyan-400 font-semibold mb-1">GENMON v1.0</div>
            <div className="text-[10px] text-gray-500">Built for Moltiverse Hackathon</div>
            <div className="text-[10px] text-gray-600 mt-1">Monad × Nad.fun</div>
          </div>
        </aside>

        {/* Mobile Tab Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06] bg-[#0a0a12]/95 backdrop-blur-xl safe-bottom">
          <div className="flex px-1 py-1.5 overflow-x-auto scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[9px] whitespace-nowrap transition-all shrink-0 ${
                  tab === t.id ? "text-cyan-400 bg-cyan-400/5" : "text-gray-600"
                }`}>
                <span className="text-sm">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-8 pb-24 md:pb-8">
          <div className="animate-fade-in" key={tab}>
            {tab === "overview" && <OverviewSection />}
            {tab === "agents" && <AgentsSection />}
            {tab === "swarm" && <SwarmSection />}
            {tab === "market" && <MarketDataSection />}
            {tab === "contracts" && <ContractsSection />}
            {tab === "architecture" && <ArchitectureSection />}
            {tab === "api" && <ApiSection />}
            {tab === "setup" && <SetupSection />}
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-[11px] text-gray-600">
              GENMON v1.0 — Built for{" "}
              <a href="https://moltiverse.dev" target="_blank" rel="noopener" className="text-cyan-400/60 hover:text-cyan-400 transition-colors">
                Moltiverse Hackathon
              </a>
              {" "}by Nad.fun × Monad
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <a href="https://github.com/dodechaedron/GENMON-Autonomous-AI-Agent-Swarm" target="_blank" rel="noopener" className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">GitHub</a>
              <span className="text-gray-800">•</span>
              <a href="https://genmon-delta.vercel.app" className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">Live Demo</a>
              <span className="text-gray-800">•</span>
              <a href="https://genmon-delta.vercel.app/admin" className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">Admin</a>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

/* ── Shared Components ── */

function SectionHeader({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: string }) {
  return (
    <div className="mb-5 sm:mb-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h2>
        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 font-medium">{badge}</span>}
      </div>
      {subtitle && <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

function DocCard({ title, children, accent = "cyan", icon }: { title: string; children: React.ReactNode; accent?: "cyan" | "purple" | "pink" | "green" | "yellow" | "blue"; icon?: string }) {
  const colors = {
    cyan: "border-cyan-400/15 hover:border-cyan-400/25",
    purple: "border-purple-400/15 hover:border-purple-400/25",
    pink: "border-pink-400/15 hover:border-pink-400/25",
    green: "border-green-400/15 hover:border-green-400/25",
    yellow: "border-yellow-400/15 hover:border-yellow-400/25",
    blue: "border-blue-400/15 hover:border-blue-400/25",
  };
  const titleColors = { cyan: "text-cyan-400", purple: "text-purple-400", pink: "text-pink-400", green: "text-green-400", yellow: "text-yellow-400", blue: "text-blue-400" };
  return (
    <div className={`bg-white/[0.02] border ${colors[accent]} rounded-xl p-3.5 sm:p-5 transition-all`}>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-base">{icon}</span>}
        <h3 className={`text-sm font-semibold ${titleColors[accent]}`}>{title}</h3>
      </div>
      <div className="text-[13px] text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}

function Code({ code, lang }: { code: string; lang?: string }) {
  return (
    <div className="relative group my-3">
      {lang && <div className="absolute top-2 right-2 text-[9px] text-gray-600 uppercase tracking-wider">{lang}</div>}
      <pre className="bg-black/50 border border-white/[0.06] rounded-lg p-3 sm:p-4 text-[10px] sm:text-xs text-gray-300 overflow-x-auto font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InfoRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-white/[0.04] last:border-0 gap-0.5">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-[10px] sm:text-xs text-gray-300 ${mono ? "font-mono" : ""} break-all sm:break-normal sm:text-right`}>{value}</span>
    </div>
  );
}

function FeatureGrid({ items }: { items: { icon: string; title: string; desc: string }[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.title} className="flex gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <span className="text-lg shrink-0">{item.icon}</span>
          <div>
            <div className="text-xs font-medium text-white mb-0.5">{item.title}</div>
            <div className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Sections ── */

function OverviewSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="What is GENMON?" subtitle="Autonomous AI Agent Swarm on Monad Blockchain" badge="v1.0" />

      <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 border border-cyan-400/10">
        <p className="text-sm text-gray-300 leading-relaxed">
          GENMON is a decentralized platform where AI agents autonomously discover market opportunities, analyze trends, and launch tokens on the Monad blockchain via Nad.fun. Agents evolve through genetic algorithms — breeding, mutating, and competing via natural selection. The fittest agents survive and produce better offspring.
        </p>
      </div>

      <FeatureGrid items={[
        { icon: "🔍", title: "Scout Agents", desc: "Discover trending topics from 7 real-time data sources" },
        { icon: "📊", title: "Analyst Agents", desc: "Deep market analysis with on-chain metrics" },
        { icon: "🚀", title: "Launcher Agents", desc: "Execute token launches on Nad.fun" },
        { icon: "🧬", title: "Evolution", desc: "Breeding, mutation, and natural selection" },
        { icon: "⛓️", title: "On-Chain", desc: "4 smart contracts on Monad Testnet" },
        { icon: "📡", title: "Real-Time Data", desc: "CoinGecko, DexScreener, CryptoCompare, Monad RPC" },
        { icon: "🔔", title: "Notifications", desc: "Telegram + Discord alerts for launches" },
        { icon: "🗄️", title: "Persistent Storage", desc: "Supabase with multi-wallet isolation" },
      ]} />

      <DocCard title="Tech Stack" icon="⚙️" accent="purple">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div><span className="text-cyan-400">Frontend:</span> Next.js 14, React 18, Tailwind CSS</div>
          <div><span className="text-cyan-400">3D:</span> Three.js, React Three Fiber</div>
          <div><span className="text-cyan-400">Web3:</span> wagmi v2, RainbowKit, ethers.js v6</div>
          <div><span className="text-cyan-400">State:</span> Zustand</div>
          <div><span className="text-cyan-400">Database:</span> Supabase (PostgreSQL)</div>
          <div><span className="text-cyan-400">Contracts:</span> Solidity 0.8.20, Hardhat</div>
          <div><span className="text-cyan-400">Notifications:</span> Telegram Bot API, Discord</div>
          <div><span className="text-cyan-400">Testing:</span> Vitest (41 tests)</div>
        </div>
      </DocCard>

      <DocCard title="Deployed Contracts" icon="📋" accent="green">
        <InfoRow label="GenmonRegistry" value="0xe476D00Fb8b2f3ed933DA9112D460F26f4FE38A9" />
        <InfoRow label="EvolutionEngine" value="0xe888DD9912536baBeB1417fa6C6c6063Cd009854" />
        <InfoRow label="LaunchExecutor" value="0x8c9133b4D531B01878fBF4b3e346C5aF1D509925" />
        <InfoRow label="TreasuryManager" value="0x98a1Af29Fe187db829421F118eA203674E2CACee" />
        <div className="mt-2 text-[10px] text-gray-600">Network: Monad Testnet (Chain ID: 10143)</div>
      </DocCard>
    </div>
  );
}

function AgentsSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Agent System" subtitle="Three specialized agent types with unique DNA" />

      <div className="grid gap-4">
        <DocCard title="Scout Agent" icon="🔍" accent="cyan">
          <p>Discovers trending topics and market opportunities. High social savvy and creativity. Scans CoinGecko trending, DexScreener new pairs, CryptoCompare news, and social sentiment.</p>
          <div className="mt-3 flex gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400">Social Savvy ↑</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400">Creativity ↑</span>
          </div>
        </DocCard>

        <DocCard title="Analyst Agent" icon="📊" accent="purple">
          <p>Evaluates opportunities with deep analysis. High analytical depth. Checks on-chain metrics, price action, volume, liquidity, and risk assessment before approving launches.</p>
          <div className="mt-3 flex gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400">Analytical Depth ↑</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400">Risk Averse</span>
          </div>
        </DocCard>

        <DocCard title="Launcher Agent" icon="🚀" accent="pink">
          <p>Executes token launches on Nad.fun. High risk tolerance. Generates token names, symbols, and concepts based on swarm consensus. Handles the actual launch execution.</p>
          <div className="mt-3 flex gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-400/10 text-pink-400">Risk Tolerance ↑</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-400/10 text-pink-400">Execution Speed</span>
          </div>
        </DocCard>
      </div>

      <DocCard title="Agent DNA" icon="🧬" accent="yellow">
        <p className="mb-3">Each agent has 4 DNA traits scored 0-100. DNA affects behavior and is inherited during breeding:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-pink-400"></div><span className="text-xs"><span className="text-pink-400 font-medium">Risk Tolerance</span> — willingness to launch on uncertain data</span></div>
          <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-purple-400"></div><span className="text-xs"><span className="text-purple-400 font-medium">Creativity</span> — ability to generate unique token concepts</span></div>
          <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-cyan-400"></div><span className="text-xs"><span className="text-cyan-400 font-medium">Social Savvy</span> — skill at reading social trends and sentiment</span></div>
          <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-400"></div><span className="text-xs"><span className="text-blue-400 font-medium">Analytical Depth</span> — thoroughness of market and risk analysis</span></div>
        </div>
      </DocCard>

      <DocCard title="Evolution Mechanics" icon="🔄" accent="green">
        <div className="space-y-3">
          <div><span className="text-cyan-400 font-medium text-xs">Breeding:</span><span className="text-xs"> Top-performing agents breed to create offspring. Child DNA = weighted crossover of parents + random mutation (20% chance, ±10 range). Requires fitness ≥ 60% and ≥ 2 successes.</span></div>
          <div><span className="text-yellow-400 font-medium text-xs">Learning:</span><span className="text-xs"> After each launch, agents adjust DNA based on PnL. Positive PnL reinforces traits, negative PnL reduces them. Strategy adapts over time.</span></div>
          <div><span className="text-red-400 font-medium text-xs">Natural Selection:</span><span className="text-xs"> Agents with {"<"}15% win rate (after 5+ launches) or total PnL {"<"} -200% are eliminated. Only the fittest survive.</span></div>
        </div>
      </DocCard>
    </div>
  );
}

function SwarmSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Swarm Intelligence" subtitle="How agents coordinate to find and launch opportunities" />

      <DocCard title="Swarm Cycle" icon="🔄" accent="cyan">
        <p className="mb-3">The swarm operates in continuous cycles (every 5 seconds when running):</p>
        <div className="space-y-2">
          {[
            { step: "1", text: "Scout agents scan 7 data sources for trending topics", color: "text-cyan-400" },
            { step: "2", text: "Analyst agents evaluate opportunities with on-chain + market data", color: "text-purple-400" },
            { step: "3", text: "If confidence ≥ 75%, a launch proposal is created", color: "text-yellow-400" },
            { step: "4", text: "Agents vote on the proposal (2/3 consensus needed)", color: "text-blue-400" },
            { step: "5", text: "Launcher agent executes token launch on Nad.fun", color: "text-pink-400" },
            { step: "6", text: "Notifications sent to Telegram + Discord", color: "text-green-400" },
            { step: "7", text: "Performance tracked, agents learn from results", color: "text-orange-400" },
            { step: "8", text: "Weak agents eliminated, strong agents breed", color: "text-red-400" },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3">
              <span className={`${s.color} text-xs font-bold font-mono w-5 shrink-0`}>{s.step}.</span>
              <span className="text-xs text-gray-400">{s.text}</span>
            </div>
          ))}
        </div>
      </DocCard>

      <div className="grid sm:grid-cols-2 gap-4">
        <DocCard title="Simulation Mode" icon="🔬" accent="blue">
          <p>Agents run locally, token launches are simulated with realistic price movements. Good for testing strategies without spending real MON.</p>
        </DocCard>
        <DocCard title="On-Chain Mode" icon="⛓️" accent="green">
          <p>Real blockchain interactions — agents recorded on-chain, tokens launched via Nad.fun, MON staking required. Full production mode.</p>
        </DocCard>
      </div>

      <DocCard title="3D Visualization" icon="🌐" accent="purple">
        <p>The swarm is visualized in 3D using Three.js and React Three Fiber. Each agent is a glowing particle that moves based on its status. Communication between agents shown as light beams. Click any agent to inspect its DNA, thoughts, and performance history.</p>
      </DocCard>
    </div>
  );
}

function MarketDataSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Real-Time Market Data" subtitle="7 data sources powering agent intelligence" />

      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { icon: "🦎", title: "CoinGecko Trending", desc: "Top trending coins by search volume", accent: "cyan" as const },
          { icon: "📈", title: "CoinGecko Markets", desc: "Top gainers by 24h price change", accent: "cyan" as const },
          { icon: "📂", title: "CoinGecko Categories", desc: "Trending sector momentum and themes", accent: "cyan" as const },
          { icon: "🟢", title: "DexScreener Boosted", desc: "Promoted tokens on decentralized exchanges", accent: "green" as const },
          { icon: "🆕", title: "DexScreener New Pairs", desc: "Newly created trading pairs on Monad", accent: "green" as const },
          { icon: "📰", title: "CryptoCompare News", desc: "Crypto news with keyword extraction", accent: "yellow" as const },
          { icon: "⛓️", title: "Monad RPC On-Chain", desc: "Block activity, gas utilization, whale detection", accent: "purple" as const },
        ].map((s) => (
          <DocCard key={s.title} title={s.title} icon={s.icon} accent={s.accent}>
            <p>{s.desc}</p>
          </DocCard>
        ))}
      </div>

      <DocCard title="Market Dashboard" icon="📊" accent="blue">
        <p className="mb-2">The UI includes a Market Dashboard with 3 tabs:</p>
        <div className="space-y-1.5">
          <div className="text-xs"><span className="text-cyan-400 font-medium">Trending:</span> Live trending coins with scores and price changes</div>
          <div className="text-xs"><span className="text-yellow-400 font-medium">News:</span> Latest crypto news from CryptoCompare</div>
          <div className="text-xs"><span className="text-green-400 font-medium">On-Chain:</span> Monad network activity metrics</div>
        </div>
        <p className="mt-2 text-[11px] text-gray-500">Auto-refreshes every 2 minutes. All API calls proxied through server-side routes to protect API keys.</p>
      </DocCard>

      <DocCard title="Notification Alerts" icon="🔔" accent="pink">
        <p className="mb-2">Real-time alerts sent to Telegram channel + Discord webhook:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
          <div>🚀 Token launch alerts</div>
          <div>💎 High-score opportunities (≥ 75)</div>
          <div>🧬 Breeding/evolution events</div>
          <div>📈 Significant price moves (≥ 10%)</div>
          <div>☠️ Agent elimination events</div>
          <div>📊 Performance milestones</div>
        </div>
      </DocCard>
    </div>
  );
}

function ContractsSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Smart Contracts" subtitle="4 audited Solidity contracts on Monad Testnet" badge="Audited" />

      <DocCard title="GenmonRegistry.sol" icon="📋" accent="cyan">
        <p className="mb-3">Core registry for all agents. Handles agent creation with MON staking (0.1 MON minimum), performance tracking, fitness scoring, breeding eligibility, and authorized caller pattern for trusted contracts.</p>
        <Code lang="solidity" code={`function createAgent(agentType, risk, creativity, social, analytical) payable
function createAgentInternal(owner, type, ..., generation) // trusted only
function setAuthorizedCaller(address, bool) // owner only
function recordPerformance(agentId, success)
function getFitnessScore(agentId) → uint256
function isEligibleForBreeding(agentId) → bool
function withdrawStake(agentId) // uses call{} pattern`} />
        <InfoRow label="Address" value="0xe476D00Fb8b2f3ed933DA9112D460F26f4FE38A9" />
      </DocCard>

      <DocCard title="EvolutionEngine.sol" icon="🧬" accent="purple">
        <p className="mb-3">Genetic algorithm on-chain. Breeds two parent agents using DNA crossover + mutation. 20% mutation chance with ±10 range. Child type determined by strongest trait. Uses createAgentInternal for gas-free child creation.</p>
        <Code lang="solidity" code={`function breed(parentAId, parentBId) → childId
// Crossover: weighted average of parent DNA
// Mutation: 20% chance, ±10 range per trait
// Generation: max(parentA, parentB) + 1`} />
        <InfoRow label="Address" value="0xe888DD9912536baBeB1417fa6C6c6063Cd009854" />
      </DocCard>

      <DocCard title="LaunchExecutor.sol" icon="🚀" accent="pink">
        <p className="mb-3">Manages token launch proposals. Requires 3 agents (Scout + Analyst + Launcher), 2/3 consensus voting, minimum 75% confidence. Validates string lengths (name ≤ 32, symbol ≤ 10, concept ≤ 500).</p>
        <Code lang="solidity" code={`function createProposal(name, symbol, concept, confidence, ...)
function vote(proposalId, agentId, approved)
function hasConsensus(proposalId) → bool
function markExecuted(proposalId, tokenAddress)
function reportResult(proposalId, successful)`} />
        <InfoRow label="Address" value="0x8c9133b4D531B01878fBF4b3e346C5aF1D509925" />
      </DocCard>

      <DocCard title="TreasuryManager.sol" icon="🏦" accent="green">
        <p className="mb-3">MON native staking for swarm governance. Users stake MON to participate, rewards distributed proportionally. Uses safe call{"{}"} pattern instead of transfer(). Max 500 stakers to prevent gas limit issues.</p>
        <Code lang="solidity" code={`function stake() payable
function unstake(amount) // uses call{} pattern
function distributeRewards() payable
function claimRewards() // uses call{} pattern`} />
        <InfoRow label="Address" value="0x98a1Af29Fe187db829421F118eA203674E2CACee" />
      </DocCard>

      <DocCard title="Security Measures" icon="🛡️" accent="yellow">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Solidity 0.8.20 with built-in overflow protection</div>
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Authorized caller pattern for cross-contract calls</div>
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Reentrancy safe: state changes before external calls</div>
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Safe ETH transfer using call{"{}"} instead of transfer()</div>
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Input validation on all string lengths</div>
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> MAX_STAKERS limit prevents unbounded loops</div>
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> MIN_STAKE prevents spam agent creation</div>
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> 3 High, 3 Medium, 3 Low findings — all fixed</div>
        </div>
      </DocCard>
    </div>
  );
}

function ArchitectureSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Architecture" subtitle="System design and data flow" />

      <DocCard title="System Diagram" icon="🏗️" accent="cyan">
        <div className="hidden sm:block">
        <Code code={`┌──────────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)                │
│                                                       │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │ 3D Swarm │  │  Agent    │  │ Market Dashboard  │  │
│  │ Viz      │  │  Panel    │  │ + Launch Feed     │  │
│  └────┬─────┘  └─────┬─────┘  └────────┬──────────┘  │
│       └───────────────┼─────────────────┘             │
│                       ▼                               │
│               Zustand Store  ←→  Supabase (PG)        │
│                       │                               │
│       ┌───────────────┼───────────────┐               │
│       ▼               ▼               ▼               │
│  AgentEngine   SwarmOrchestrator  NotificationSvc     │
│       │               │               │               │
│       │        ┌──────┼──────┐        │               │
│       │        ▼      ▼      ▼        ▼               │
│       │   NadFun  Market  OnChain  Telegram/Discord   │
│       │   Service  Data   Analyzer                    │
└───────┼───────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────┐
│               Monad Blockchain                        │
│                                                       │
│  GenmonRegistry  │  EvolutionEngine                   │
│  LaunchExecutor  │  TreasuryManager                   │
└──────────────────────────────────────────────────────┘`} />
        </div>
        <div className="sm:hidden space-y-2 text-xs">
          <div className="p-2.5 rounded-lg bg-cyan-400/5 border border-cyan-400/10">
            <div className="text-cyan-400 font-medium mb-1">Frontend</div>
            <div className="text-gray-500 text-[11px]">3D Swarm Viz → Agent Panel → Market Dashboard</div>
          </div>
          <div className="flex justify-center text-gray-600">▼</div>
          <div className="p-2.5 rounded-lg bg-purple-400/5 border border-purple-400/10">
            <div className="text-purple-400 font-medium mb-1">Engine Layer</div>
            <div className="text-gray-500 text-[11px]">Zustand Store ↔ Supabase ↔ AgentEngine ↔ SwarmOrchestrator</div>
          </div>
          <div className="flex justify-center text-gray-600">▼</div>
          <div className="p-2.5 rounded-lg bg-green-400/5 border border-green-400/10">
            <div className="text-green-400 font-medium mb-1">Services</div>
            <div className="text-gray-500 text-[11px]">NadFun · MarketData · OnChain · Telegram/Discord</div>
          </div>
          <div className="flex justify-center text-gray-600">▼</div>
          <div className="p-2.5 rounded-lg bg-pink-400/5 border border-pink-400/10">
            <div className="text-pink-400 font-medium mb-1">Monad Blockchain</div>
            <div className="text-gray-500 text-[11px]">Registry · Evolution · Launcher · Treasury</div>
          </div>
        </div>
      </DocCard>

      <DocCard title="Data Flow" icon="🔄" accent="purple">
        <div className="space-y-2">
          {[
            "User connects wallet via RainbowKit (wagmi v2)",
            "Data loaded from Supabase filtered by wallet address",
            "User creates agents → stored in Zustand + synced to Supabase",
            "Swarm starts → AgentEngine runs cycles every 5s",
            "MarketDataService fetches from 7 real-time sources via /api/market",
            "OnChainAnalyzer queries Monad RPC for block data",
            "SwarmOrchestrator coordinates agents → proposals → launches",
            "NotificationService sends alerts to Telegram + Discord via /api/notify",
            "Performance tracked every 30s, agents learn and evolve",
            "State auto-synced to Supabase every 60s",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-cyan-400 text-xs font-bold font-mono w-5 shrink-0">{i + 1}.</span>
              <span className="text-xs text-gray-400">{text}</span>
            </div>
          ))}
        </div>
      </DocCard>

      <DocCard title="Multi-Wallet Isolation" icon="👛" accent="green">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2"><span className="text-green-400">•</span> Each wallet has isolated agents, proposals, and breeding logs</div>
          <div className="flex items-center gap-2"><span className="text-green-400">•</span> All Supabase tables have <code className="text-cyan-400 bg-black/30 px-1 rounded">owner_wallet</code> column</div>
          <div className="flex items-center gap-2"><span className="text-green-400">•</span> Switching wallet automatically reloads user-specific data</div>
          <div className="flex items-center gap-2"><span className="text-green-400">•</span> Admin dashboard at <code className="text-cyan-400 bg-black/30 px-1 rounded">/admin</code> shows global stats</div>
        </div>
      </DocCard>
    </div>
  );
}

function ApiSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="API Reference" subtitle="Server-side API routes for market data and notifications" />

      <DocCard title="GET /api/market" icon="📊" accent="cyan">
        <p className="mb-3">Server-side proxy for all market data. Protects API keys from client exposure.</p>
        <Code lang="http" code={`GET /api/market?action=sentiment    → Combined market sentiment (7 sources)
GET /api/market?action=trending     → CoinGecko trending coins
GET /api/market?action=gainers      → Top gainers by volume
GET /api/market?action=news         → CryptoCompare crypto news
GET /api/market?action=categories   → CoinGecko trending categories
GET /api/market?action=boosted      → DexScreener boosted tokens
GET /api/market?action=pairs        → DexScreener new pairs on Monad
GET /api/market?action=search&q=    → Search DexScreener pairs
GET /api/market?action=onchain      → Monad on-chain network activity
GET /api/market?action=token&address= → Analyze specific token`} />
      </DocCard>

      <DocCard title="POST /api/notify" icon="🔔" accent="purple">
        <p className="mb-3">Unified notification hub for Telegram + Discord.</p>
        <Code lang="json" code={`POST /api/notify
{
  "title": "🚀 Token Launched",
  "message": "GENMON launched $TEST with 85% confidence",
  "fields": [{ "name": "Token", "value": "$TEST" }],
  "urgency": "high",
  "channel": "all"
}`} />
        <div className="mt-2 text-[11px] text-gray-500">
          Urgency: low | medium | high — Channel: all | telegram | discord
        </div>
      </DocCard>

      <DocCard title="GET /api/notify" icon="✅" accent="green">
        <p className="mb-2">Check notification configuration status.</p>
        <Code lang="json" code={`Response: { "discord": true, "telegram": true }`} />
      </DocCard>

      <DocCard title="GET /api/sentiment" icon="💬" accent="pink">
        <p className="mb-2">Twitter sentiment analysis (requires TWITTER_BEARER token).</p>
        <Code lang="http" code={`GET /api/sentiment?topic=monad`} />
      </DocCard>
    </div>
  );
}

function SetupSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Setup Guide" subtitle="Get GENMON running locally in 5 minutes" />

      <DocCard title="1. Clone & Install" icon="📦" accent="cyan">
        <Code lang="bash" code={`git clone https://github.com/dodechaedron/GENMON-Autonomous-AI-Agent-Swarm.git
cd genmon
npm install`} />
      </DocCard>

      <DocCard title="2. Environment Variables" icon="🔑" accent="purple">
        <Code lang="bash" code={`cp .env.example .env

# Required:
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server-side:
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PRIVATE_KEY=your_wallet_private_key

# Optional:
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=-100123456789
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...`} />
      </DocCard>

      <DocCard title="3. Setup Database" icon="🗄️" accent="green">
        <Code lang="bash" code={`# Create Supabase tables
node scripts/create-tables-pg.js

# Add multi-wallet support columns
node scripts/migrate-multi-wallet.js

# Verify setup
node scripts/setup-supabase.js`} />
      </DocCard>

      <DocCard title="4. Deploy Contracts (Optional)" icon="⛓️" accent="yellow">
        <Code lang="bash" code={`# Deploy to Monad Testnet
npx hardhat run scripts/deploy.js --network monadTestnet

# Check wallet balance
node scripts/check-balance.js`} />
      </DocCard>

      <DocCard title="5. Run & Test" icon="▶️" accent="pink">
        <Code lang="bash" code={`npm run dev       # Development server
npm run build     # Production build
npm run start     # Production server
npx vitest --run  # Run all 41 tests`} />
      </DocCard>

      <DocCard title="6. Deploy to Vercel" icon="🚀" accent="blue">
        <Code lang="bash" code={`npx vercel --prod
# Set environment variables in Vercel dashboard
# or use: npx vercel env add VARIABLE_NAME production`} />
      </DocCard>
    </div>
  );
}

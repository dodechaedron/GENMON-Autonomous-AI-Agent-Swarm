"use client";
import { useState, useEffect, Component, ReactNode } from "react";
import Link from "next/link";
import { SupabaseService } from "@/services/SupabaseService";
import type { GenmonAgent, LaunchProposal } from "@/store/useGenmonStore";

// Error boundary to catch client-side crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-space text-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-red-400 text-lg">Admin Dashboard Error</p>
            <p className="text-gray-500 text-sm">{this.state.error}</p>
            <Link href="/" className="text-cyan text-sm underline">← Back to Home</Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface GlobalStats {
  totalAgents: number;
  aliveAgents: number;
  totalProposals: number;
  executedProposals: number;
  totalBreedings: number;
  uniqueWallets: number;
  topAgents: GenmonAgent[];
  recentProposals: LaunchProposal[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getGlobalStats();
      setStats(data);
      setLastRefresh(new Date());
    } catch {
      setStats({ totalAgents: 0, aliveAgents: 0, totalProposals: 0, executedProposals: 0, totalBreedings: 0, uniqueWallets: 0, topAgents: [], recentProposals: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleKill = async (id: string, name: string) => {
    if (!confirm(`Kill agent "${name}"? This marks it as dead but keeps the record.`)) return;
    const ok = await SupabaseService.killAgent(id);
    if (ok) refresh();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete agent "${name}"? This cannot be undone.`)) return;
    const ok = await SupabaseService.deleteAgent(id);
    if (ok) refresh();
  };

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
    <main className="min-h-screen bg-space text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/5 bg-space/90 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden ring-1 ring-cyan/30">
              <img src="/logo.png" alt="GENMON" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-bold">
              <span className="text-cyan">GEN</span><span className="text-purple">MON</span>
            </span>
          </Link>
          <span className="text-gray-600 text-xs sm:text-sm hidden sm:inline">/ Admin</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {lastRefresh && (
            <span className="text-[9px] sm:text-[10px] text-gray-600 hidden sm:inline">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button onClick={refresh} disabled={loading}
            className="px-2 sm:px-3 py-1.5 rounded-lg border border-cyan/30 text-cyan text-[10px] sm:text-xs hover:bg-cyan/10 disabled:opacity-50 transition-all">
            ↻
          </button>
          <Link href="/" className="px-2 sm:px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-[10px] sm:text-xs hover:text-white transition-all">
            ← Back
          </Link>
        </div>
      </header>

      {loading && !stats ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin mx-auto mb-3" />
            <p className="text-cyan text-sm">Loading...</p>
          </div>
        </div>
      ) : stats ? (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Agents" value={stats.totalAgents} icon="🤖" color="text-cyan" />
            <StatCard label="Alive Agents" value={stats.aliveAgents} icon="💚" color="text-green-400" />
            <StatCard label="Proposals" value={stats.totalProposals} icon="📋" color="text-purple" />
            <StatCard label="Executed" value={stats.executedProposals} icon="🚀" color="text-pink" />
            <StatCard label="Breedings" value={stats.totalBreedings} icon="🧬" color="text-yellow-400" />
            <StatCard label="Wallets" value={stats.uniqueWallets} icon="👛" color="text-blue-400" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Agents Leaderboard */}
            <div className="bg-space-light/50 border border-cyan/15 rounded-xl p-4">
              <h2 className="text-cyan text-xs font-semibold uppercase tracking-wider mb-3">
                🏆 Top Agents by PnL
              </h2>
              {stats.topAgents.length === 0 ? (
                <p className="text-gray-600 text-sm">No agents yet</p>
              ) : (
                <div className="space-y-2">
                  {stats.topAgents.map((agent, i) => (
                    <div key={agent.id} className="bg-white/[0.02] rounded-lg p-2.5">
                      {/* Row 1: Rank + Name + PnL */}
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg w-6 sm:w-7 text-center shrink-0">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </span>
                        <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none" style={{ color: agent.color }}>
                            {agent.name}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-gray-500 bg-white/5 px-1 sm:px-1.5 py-0.5 rounded">
                            {agent.type}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-gray-600 hidden sm:inline">Gen {agent.generation}</span>
                          {!agent.alive && <span className="text-[9px] sm:text-[10px] text-red-400">☠️</span>}
                        </div>
                        <span className={`text-xs sm:text-sm font-mono font-bold shrink-0 ${(agent.totalPnL ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {(agent.totalPnL ?? 0) >= 0 ? "+" : ""}{(agent.totalPnL ?? 0).toFixed(1)}%
                        </span>
                      </div>
                      {/* Row 2: Stats + Actions */}
                      <div className="flex items-center justify-between mt-1.5 ml-8 sm:ml-9">
                        <div className="flex gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-gray-500">
                          <span>W:{agent.successCount ?? 0}</span>
                          <span>L:{agent.failCount ?? 0}</span>
                          <span className="hidden sm:inline">Launches:{agent.launchCount ?? 0}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {agent.alive && (
                            <button
                              onClick={() => handleKill(agent.id, agent.name)}
                              className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all"
                              title="Kill agent"
                            >Kill</button>
                          )}
                          <button
                            onClick={() => handleDelete(agent.id, agent.name)}
                            className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                            title="Delete agent"
                          >Del</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Proposals */}
            <div className="bg-space-light/50 border border-purple/15 rounded-xl p-4">
              <h2 className="text-purple text-xs font-semibold uppercase tracking-wider mb-3">
                📋 Recent Proposals
              </h2>
              {stats.recentProposals.length === 0 ? (
                <p className="text-gray-600 text-sm">No proposals yet</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {stats.recentProposals.map((p) => (
                    <div key={p.id} className="bg-white/[0.02] rounded-lg p-2 sm:p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs sm:text-sm font-medium text-white truncate">{p.tokenName}</span>
                          <span className="text-[9px] sm:text-[10px] text-gray-500">{p.tokenSymbol}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                          {p.executed ? (
                            <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                              ✓
                            </span>
                          ) : (
                            <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                              ⏳
                            </span>
                          )}
                          <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded ${
                            p.mode === "onchain" ? "bg-blue-500/10 text-blue-400" : "bg-gray-500/10 text-gray-400"
                          }`}>
                            {p.mode || "sim"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-gray-500 mt-1">
                        <span>{p.confidence ?? 0}%</span>
                        {p.priceChange != null && (
                          <span className={(p.priceChange ?? 0) >= 0 ? "text-green-400" : "text-red-400"}>
                            {(p.priceChange ?? 0) >= 0 ? "+" : ""}{(p.priceChange ?? 0).toFixed(1)}%
                          </span>
                        )}
                        <span>{new Date(p.timestamp || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Platform Info */}
          <div className="bg-space-light/30 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-gray-500 text-xs">
              GENMON Admin Dashboard — Real-time data from Supabase
            </p>
            <p className="text-gray-600 text-[10px] mt-1">
              Auto-refreshes every 30 seconds • {stats.uniqueWallets} connected wallet{stats.uniqueWallets !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Supabase not configured</p>
        </div>
      )}
    </main>
    </ErrorBoundary>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-space-light/50 border border-white/5 rounded-xl p-3 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

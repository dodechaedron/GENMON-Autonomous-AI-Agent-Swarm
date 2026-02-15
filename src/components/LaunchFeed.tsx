"use client";
import { useGenmonStore } from "@/store/useGenmonStore";

export default function LaunchFeed() {
  const proposals = useGenmonStore((s) => s.proposals);
  const messages = useGenmonStore((s) => s.swarmMessages);

  // Separate launched vs pending
  const launched = proposals.filter((p) => p.executed);
  const pending = proposals.filter((p) => !p.executed);

  // Aggregate stats
  const totalLaunched = launched.length;
  const winners = launched.filter((p) => (p.priceChange ?? 0) > 0).length;
  const winRate = totalLaunched > 0 ? Math.round((winners / totalLaunched) * 100) : 0;
  const avgPnL = totalLaunched > 0
    ? launched.reduce((sum, p) => sum + (p.priceChange ?? 0), 0) / totalLaunched
    : 0;

  return (
    <div className="bg-space-light/50 border border-purple/15 rounded-xl p-3 box-glow-purple">
      <h2 className="text-purple font-semibold mb-2 glow-purple text-xs tracking-wider uppercase">
        Launch Feed ({proposals.length})
      </h2>

      {/* Performance Summary */}
      {totalLaunched > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <MiniStat label="Launched" value={String(totalLaunched)} color="text-purple" />
          <MiniStat
            label="Win Rate"
            value={`${winRate}%`}
            color={winRate >= 50 ? "text-green-400" : "text-red-400"}
          />
          <MiniStat
            label="Avg PnL"
            value={`${avgPnL >= 0 ? "+" : ""}${avgPnL.toFixed(1)}%`}
            color={avgPnL >= 0 ? "text-green-400" : "text-red-400"}
          />
        </div>
      )}

      {proposals.length > 0 ? (
        <div className="space-y-2 max-h-[350px] lg:max-h-[300px] overflow-y-auto pr-1">
          {[...proposals].reverse().map((p) => (
            <div key={p.id} className="border border-white/5 rounded-lg p-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors animate-fade-in">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <span className="text-white text-sm font-medium">{p.tokenName}</span>
                  <span className="text-gray-600 text-[10px] ml-1.5">{p.tokenSymbol}</span>
                </div>
                <ConfidenceBadge value={p.confidence} />
              </div>
              <p className="text-[10px] text-gray-600 mt-1 leading-relaxed line-clamp-2">{p.concept}</p>

              {/* Votes */}
              <div className="flex items-center gap-3 mt-1.5">
                <VoteBadge label="Scout" vote={p.votes.scout} />
                <VoteBadge label="Analyst" vote={p.votes.analyst} />
                <VoteBadge label="Launcher" vote={p.votes.launcher} />
              </div>

              {/* Performance Tracking */}
              {p.executed && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {p.successful ? (
                        <span className="text-[10px] text-green-400">✅ Live</span>
                      ) : p.successful === false ? (
                        <span className="text-[10px] text-red-400">❌ Failed</span>
                      ) : (
                        <span className="text-[10px] text-yellow-400">⏳ Pending</span>
                      )}
                      {p.mode === "simulation" && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-400/10 text-yellow-500 border border-yellow-400/20">SIM</span>
                      )}
                    </div>
                    {p.priceChange !== undefined && (
                      <PnLBadge change={p.priceChange} />
                    )}
                  </div>

                  {/* Price & Volume row */}
                  {(p.currentPrice !== undefined || p.volume24h !== undefined) && (
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                      {p.currentPrice !== undefined && (
                        <span>
                          Price: <span className="text-white/70 font-mono">${formatPrice(p.currentPrice)}</span>
                        </span>
                      )}
                      {p.volume24h !== undefined && p.volume24h > 0 && (
                        <span>
                          Vol: <span className="text-white/70 font-mono">${formatVol(p.volume24h)}</span>
                        </span>
                      )}
                      {p.lastChecked && (
                        <span className="ml-auto text-gray-700 text-[9px]">
                          {timeAgo(p.lastChecked)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Token address */}
                  {p.tokenAddress && (
                    <div className="mt-1 text-[9px] text-gray-600 font-mono truncate">
                      {p.tokenAddress.slice(0, 6)}...{p.tokenAddress.slice(-4)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-2xl mb-2 opacity-20">◆</div>
          <p className="text-gray-600 text-xs">No launches yet</p>
          <p className="text-gray-700 text-[10px] mt-1">Swarm is analyzing opportunities...</p>
        </div>
      )}

      {messages.length > 0 && (
        <>
          <h3 className="text-purple/50 text-[10px] font-medium mt-4 mb-2 uppercase tracking-wider">
            Swarm Chatter
          </h3>
          <div className="space-y-0.5 max-h-20 overflow-y-auto pr-1">
            {messages.slice(-8).reverse().map((m, i) => (
              <p key={i} className="text-[10px] text-gray-600 font-mono truncate leading-relaxed">
                <span className="text-cyan/40">{m.from.slice(-4)}</span>
                <span className="text-gray-700"> → </span>
                <span className="text-purple/40">{m.to.slice(-4)}</span>
                <span className="text-gray-700">: </span>
                <span className="text-gray-500">{m.message}</span>
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function PnLBadge({ change }: { change: number }) {
  const isUp = change >= 0;
  return (
    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${
      isUp
        ? "text-green-400 bg-green-400/10 border-green-400/20"
        : "text-red-400 bg-red-400/10 border-red-400/20"
    }`}>
      {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{change.toFixed(1)}%
    </span>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-lg px-2 py-1.5 text-center">
      <div className={`text-xs font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[9px] text-gray-600">{label}</div>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const color = value >= 85
    ? "bg-green-500/15 text-green-400 border-green-500/20"
    : value >= 75
    ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
    : "bg-red-500/15 text-red-400 border-red-500/20";

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${color} font-mono shrink-0`}>
      {value}%
    </span>
  );
}

function VoteBadge({ label, vote }: { label: string; vote: boolean | null }) {
  const color = vote === true ? "text-green-400/70" : vote === false ? "text-red-400/70" : "text-gray-700";
  const icon = vote === true ? "✓" : vote === false ? "✗" : "·";
  return (
    <span className={`text-[10px] ${color} flex items-center gap-0.5`}>
      {icon} {label}
    </span>
  );
}

/* ── Helpers ── */

function formatPrice(price: number): string {
  if (price === 0) return "0";
  if (price < 0.000001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toFixed(2);
}

function formatVol(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
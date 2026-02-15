"use client";
import { useState } from "react";
import { useGenmonStore, GenmonAgent } from "@/store/useGenmonStore";

const TYPE_ICONS = { SCOUT: "🔍", ANALYST: "📊", LAUNCHER: "🚀" };
const STATUS_COLORS: Record<string, string> = {
  idle: "text-gray-500", scouting: "text-cyan", analyzing: "text-purple",
  launching: "text-pink", breeding: "text-yellow-400",
};
const STATUS_DOT: Record<string, string> = {
  idle: "bg-gray-500", scouting: "bg-cyan", analyzing: "bg-purple",
  launching: "bg-pink", breeding: "bg-yellow-400",
};

type PanelTab = "agents" | "leaderboard";

export default function AgentPanel() {
  const agents = useGenmonStore((s) => s.agents);
  const selectedId = useGenmonStore((s) => s.selectedAgent);
  const selectAgent = useGenmonStore((s) => s.selectAgent);
  const selected = agents.find((a) => a.id === selectedId);
  const [tab, setTab] = useState<PanelTab>("agents");

  return (
    <div className="bg-space-light/50 border border-cyan/15 rounded-xl p-3 box-glow-cyan">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={() => setTab("agents")}
          className={`text-[10px] px-2 py-1 rounded transition-all ${
            tab === "agents" ? "text-cyan bg-cyan/10 border border-cyan/30" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Agents ({agents.length})
        </button>
        <button
          onClick={() => setTab("leaderboard")}
          className={`text-[10px] px-2 py-1 rounded transition-all ${
            tab === "leaderboard" ? "text-yellow-400 bg-yellow-400/10 border border-yellow-400/30" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          🏆 Leaderboard
        </button>
      </div>

      {tab === "agents" && (
        <>
          <div className="space-y-1.5 max-h-[200px] lg:max-h-[180px] overflow-y-auto mb-3 pr-1">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => selectAgent(agent.id === selectedId ? null : agent.id)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all active:scale-[0.98] ${
                  selectedId === agent.id
                    ? "border-cyan/40 bg-cyan/10"
                    : "border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{TYPE_ICONS[agent.type]}</span>
                    <span className="text-sm text-white truncate">{agent.name}</span>
                    {agent.generation > 0 && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                        G{agent.generation}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[agent.status]} ${agent.status !== "idle" ? "animate-pulse" : ""}`} />
                    <span className={`text-[10px] ${STATUS_COLORS[agent.status]}`}>{agent.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-600">
                  <span className="text-green-400/70">{agent.successCount}W</span>
                  <span className="text-red-400/70">{agent.failCount}L</span>
                  {agent.totalPnL !== 0 && (
                    <span className={agent.totalPnL >= 0 ? "text-green-400" : "text-red-400"}>
                      {agent.totalPnL >= 0 ? "+" : ""}{agent.totalPnL.toFixed(1)}%
                    </span>
                  )}
                  {!agent.alive && <span className="text-red-400 ml-auto">☠ DEAD</span>}
                </div>
              </button>
            ))}
            {agents.length === 0 && (
              <div className="text-center py-8">
                <div className="text-2xl mb-2 opacity-30">◎</div>
                <p className="text-gray-600 text-xs">No agents yet</p>
                <p className="text-gray-700 text-[10px] mt-1">Create your first GENMON agent</p>
              </div>
            )}
          </div>

          {/* Selected agent detail */}
          {selected && <AgentDetail agent={selected} />}
        </>
      )}

      {tab === "leaderboard" && <Leaderboard agents={agents} />}
    </div>
  );
}

/* ── Agent Detail with DNA Visualization ── */
function AgentDetail({ agent }: { agent: GenmonAgent }) {
  const agents = useGenmonStore((s) => s.agents);
  const parentA = agent.parentIds ? agents.find((a) => a.id === agent.parentIds![0]) : null;
  const parentB = agent.parentIds ? agents.find((a) => a.id === agent.parentIds![1]) : null;
  const winRate = agent.launchCount > 0 ? Math.round((agent.successCount / agent.launchCount) * 100) : 0;

  return (
    <div className="border-t border-white/5 pt-3 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        <MiniStat label="Win%" value={`${winRate}%`} color={winRate >= 50 ? "text-green-400" : "text-red-400"} />
        <MiniStat label="PnL" value={`${agent.totalPnL >= 0 ? "+" : ""}${agent.totalPnL.toFixed(0)}%`} color={agent.totalPnL >= 0 ? "text-green-400" : "text-red-400"} />
        <MiniStat label="Launches" value={String(agent.launchCount)} color="text-purple" />
        <MiniStat label="Best" value={`${agent.bestLaunchPnL > 0 ? "+" : ""}${agent.bestLaunchPnL.toFixed(0)}%`} color="text-cyan" />
      </div>

      {/* DNA Radar */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-cyan text-xs font-medium">DNA Profile</h3>
        <span className="text-[10px] text-gray-600">{agent.type}</span>
      </div>
      <DNARadar dna={agent.dna} color={agent.color} />

      {/* DNA Bars */}
      <div className="space-y-1.5 mt-2">
        <DNABar label="Risk" value={agent.dna.riskTolerance} color="bg-pink" />
        <DNABar label="Creative" value={agent.dna.creativity} color="bg-purple" />
        <DNABar label="Social" value={agent.dna.socialSavvy} color="bg-cyan" />
        <DNABar label="Analytical" value={agent.dna.analyticalDepth} color="bg-blue-400" />
      </div>

      {/* Lineage */}
      {agent.parentIds && (
        <div className="mt-3 pt-2 border-t border-white/5">
          <h3 className="text-yellow-400 text-[10px] font-medium mb-1">🧬 Lineage</h3>
          <div className="text-[10px] text-gray-500">
            Parents: <span className="text-cyan">{parentA?.name || "?"}</span> × <span className="text-purple">{parentB?.name || "?"}</span>
          </div>
        </div>
      )}

      {/* Thoughts */}
      <h3 className="text-cyan text-xs font-medium mt-3 mb-1.5">Thoughts</h3>
      <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
        {agent.thoughts.slice(-5).map((t, i) => (
          <p key={i} className="text-[10px] text-gray-500 font-mono leading-relaxed">
            <span className="text-cyan/40">→</span> {t}
          </p>
        ))}
        {agent.thoughts.length === 0 && (
          <p className="text-[10px] text-gray-700 italic">Waiting for swarm cycle...</p>
        )}
      </div>
    </div>
  );
}

/* ── DNA Radar Chart (SVG) ── */
function DNARadar({ dna, color }: { dna: GenmonAgent["dna"]; color: string }) {
  const cx = 50, cy = 50, r = 38;
  const traits = [
    { key: "riskTolerance", label: "Risk", angle: -90 },
    { key: "creativity", label: "Create", angle: 0 },
    { key: "analyticalDepth", label: "Analyze", angle: 90 },
    { key: "socialSavvy", label: "Social", angle: 180 },
  ] as const;

  const points = traits.map((t) => {
    const val = dna[t.key] / 100;
    const rad = (t.angle * Math.PI) / 180;
    return { x: cx + Math.cos(rad) * r * val, y: cy + Math.sin(rad) * r * val, label: t.label, val: dna[t.key] };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox="0 0 100 100" className="w-full h-24 opacity-80">
      {/* Grid */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={traits.map((t) => {
            const rad = (t.angle * Math.PI) / 180;
            return `${cx + Math.cos(rad) * r * level},${cy + Math.sin(rad) * r * level}`;
          }).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"
        />
      ))}
      {/* Axes */}
      {traits.map((t) => {
        const rad = (t.angle * Math.PI) / 180;
        return (
          <line key={t.key} x1={cx} y1={cy} x2={cx + Math.cos(rad) * r} y2={cy + Math.sin(rad) * r}
            stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        );
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill={color + "20"} stroke={color} strokeWidth="1.5" />
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} />
      ))}
      {/* Labels */}
      {points.map((p, i) => {
        const t = traits[i];
        const rad = (t.angle * Math.PI) / 180;
        const lx = cx + Math.cos(rad) * (r + 10);
        const ly = cy + Math.sin(rad) * (r + 10);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.4)" fontSize="4" fontFamily="monospace">
            {p.label} {p.val}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Leaderboard ── */
function Leaderboard({ agents }: { agents: GenmonAgent[] }) {
  const ranked = [...agents]
    .filter((a) => a.launchCount > 0)
    .map((a) => ({
      ...a,
      winRate: a.launchCount > 0 ? a.successCount / a.launchCount : 0,
      fitness: (a.launchCount > 0 ? a.successCount / a.launchCount : 0) * 50 + a.totalPnL * 0.1,
    }))
    .sort((a, b) => b.fitness - a.fitness);

  if (ranked.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-2xl mb-2 opacity-20">🏆</div>
        <p className="text-gray-600 text-xs">No data yet</p>
        <p className="text-gray-700 text-[10px] mt-1">Run swarm cycles to populate leaderboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
      {ranked.map((agent, i) => (
        <div key={agent.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
          !agent.alive ? "opacity-40 border-red-400/10" : "border-white/5 bg-white/[0.02]"
        }`}>
          <span className={`text-xs font-bold w-5 text-center ${
            i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-gray-600"
          }`}>
            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
          </span>
          <span className="text-sm shrink-0">{TYPE_ICONS[agent.type]}</span>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-white truncate">{agent.name}</div>
            <div className="text-[9px] text-gray-600">
              Gen {agent.generation} · {agent.launchCount} launches
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-xs font-mono font-bold ${agent.totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
              {agent.totalPnL >= 0 ? "+" : ""}{agent.totalPnL.toFixed(1)}%
            </div>
            <div className="text-[9px] text-gray-500">{Math.round(agent.winRate * 100)}% win</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Shared ── */
function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded px-1.5 py-1 text-center">
      <div className={`text-[10px] font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[8px] text-gray-600">{label}</div>
    </div>
  );
}

function DNABar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${value}%`, opacity: 0.4 + (value / 100) * 0.6 }} />
      </div>
      <span className="text-[10px] text-gray-600 w-6 text-right font-mono">{value}</span>
    </div>
  );
}
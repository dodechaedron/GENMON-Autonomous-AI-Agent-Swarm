"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useGenmonStore } from "@/store/useGenmonStore";
import { AgentEngine } from "@/engine/AgentEngine";
import { SwarmOrchestrator } from "@/engine/SwarmOrchestrator";
import { useWallet, useEthersSigner } from "@/hooks/useWallet";
import { NadFunLaunchResult } from "@/services/NadFunService";

export default function SwarmControls({ compact }: { compact?: boolean }) {
  const agents = useGenmonStore((s) => s.agents);
  const addProposal = useGenmonStore((s) => s.addProposal);
  const addThought = useGenmonStore((s) => s.addThought);
  const addSwarmMessage = useGenmonStore((s) => s.addSwarmMessage);
  const updateAgentStatus = useGenmonStore((s) => s.updateAgentStatus);
  const [running, setRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [mode, setMode] = useState<"simulation" | "onchain">("simulation");
  const [lastLaunch, setLastLaunch] = useState<NadFunLaunchResult | null>(null);
  const [notifyStatus, setNotifyStatus] = useState<{ discord: boolean; telegram: boolean } | null>(null);
  const { isCorrectChain } = useWallet();
  const { getSigner } = useEthersSigner();
  const orchestratorRef = useRef<SwarmOrchestrator | null>(null);

  // Check notification config on mount
  useEffect(() => {
    fetch("/api/notify").then((r) => r.json()).then(setNotifyStatus).catch(() => {});
  }, []);

  // Initialize orchestrator when wallet changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const signer = await getSigner();
      if (cancelled) return;
      orchestratorRef.current = new SwarmOrchestrator({
        signer: signer || null,
        useOnChain: mode === "onchain" && isCorrectChain,
      });
    })();
    return () => { cancelled = true; };
  }, [getSigner, mode, isCorrectChain]);

  const runCycle = useCallback(async () => {
    const aliveAgents = agents.filter((a) => a.alive);
    if (aliveAgents.length < 3) return;

    if (mode === "onchain" && orchestratorRef.current) {
      // Full cycle with Nad.fun + Discord + on-chain
      const result = await orchestratorRef.current.runFullCycle(aliveAgents);
      if (result.nadFunResult) setLastLaunch(result.nadFunResult);
    } else {
      // Simulation mode (original behavior)
      aliveAgents.forEach((a) => {
        const status = a.type === "SCOUT" ? "scouting" : a.type === "ANALYST" ? "analyzing" : "launching";
        updateAgentStatus(a.id, status);
      });

      const result = AgentEngine.runSwarmCycle(aliveAgents);
      result.thoughts.forEach((thought, agentId) => addThought(agentId, thought));
      result.messages.forEach((msg) => addSwarmMessage(msg.from, msg.to, msg.message));
      if (result.proposal) addProposal(result.proposal);

      setTimeout(() => aliveAgents.forEach((a) => updateAgentStatus(a.id, "idle")), 2000);
    }

    setCycleCount((c) => c + 1);
  }, [agents, addProposal, addThought, addSwarmMessage, updateAgentStatus, mode]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(runCycle, 5000);
    return () => clearInterval(interval);
  }, [running, runCycle]);

  // Track performance of launched tokens every 30s while running
  useEffect(() => {
    if (!running || !orchestratorRef.current) return;
    const track = () => orchestratorRef.current?.trackLaunchPerformance();
    track(); // immediate first check
    const interval = setInterval(track, 30_000);
    return () => clearInterval(interval);
  }, [running]);

  const hasMinAgents = agents.filter((a) => a.alive).length >= 3;
  const scoutCount = agents.filter((a) => a.type === "SCOUT" && a.alive).length;
  const analystCount = agents.filter((a) => a.type === "ANALYST" && a.alive).length;
  const launcherCount = agents.filter((a) => a.type === "LAUNCHER" && a.alive).length;
  const hasAllTypes = scoutCount > 0 && analystCount > 0 && launcherCount > 0;

  if (compact) {
    return (
      <div className="bg-space/80 backdrop-blur-xl border border-white/10 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => hasAllTypes ? setRunning(!running) : null}
            disabled={!hasAllTypes}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              running
                ? "bg-red-500/20 border border-red-500/40 text-red-400"
                : "bg-cyan/20 border border-cyan/40 text-cyan"
            } disabled:opacity-30 disabled:active:scale-100`}
          >
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
          <button
            onClick={runCycle}
            disabled={!hasAllTypes}
            className="px-3 py-2 rounded-lg text-xs border border-purple/40 text-purple hover:bg-purple/10 disabled:opacity-30 transition-all active:scale-95"
          >
            Step
          </button>
          <div className="flex gap-1.5 ml-auto">
            <MiniStat value={scoutCount} color="bg-cyan" />
            <MiniStat value={analystCount} color="bg-purple" />
            <MiniStat value={launcherCount} color="bg-pink" />
          </div>
          <span className="text-[10px] text-gray-600">#{cycleCount}</span>
        </div>
        {!hasAllTypes && (
          <p className="text-[10px] text-yellow-400/60 mt-2">
            Need 1 Scout + 1 Analyst + 1 Launcher
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-space-light/50 border border-pink/15 rounded-xl p-3 box-glow-pink">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-pink font-semibold text-xs tracking-wider uppercase glow-pink">
          Swarm Control
        </h2>
        <div className="flex items-center gap-2">
          {running && (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
          <span className="text-[10px] text-gray-600">Cycle #{cycleCount}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => hasAllTypes ? setRunning(!running) : null}
          disabled={!hasAllTypes}
          className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98] ${
            running
              ? "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
              : "bg-gradient-to-r from-cyan/15 to-cyan/10 border border-cyan/30 text-cyan hover:from-cyan/25 hover:to-cyan/15"
          } disabled:opacity-30 disabled:active:scale-100`}
        >
          {running ? "⏸ Pause Swarm" : "▶ Start Swarm"}
        </button>
        <button
          onClick={runCycle}
          disabled={!hasAllTypes}
          className="px-4 py-2.5 rounded-lg text-xs border border-purple/30 text-purple hover:bg-purple/10 disabled:opacity-30 transition-all active:scale-[0.98]"
        >
          Step
        </button>
      </div>

      {!hasAllTypes && (
        <p className="text-[10px] text-yellow-400/60 mt-2 leading-relaxed">
          Need at least 1 Scout + 1 Analyst + 1 Launcher to run swarm.
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] text-gray-500">Mode:</span>
        <button
          onClick={() => setMode(mode === "simulation" ? "onchain" : "simulation")}
          className={`text-[10px] px-2 py-1 rounded border transition-all ${
            mode === "onchain"
              ? "border-green-500/40 text-green-400 bg-green-500/10"
              : "border-gray-600 text-gray-400 bg-white/5"
          }`}
        >
          {mode === "onchain" ? "⛓ On-Chain" : "🔬 Simulation"}
        </button>
        {lastLaunch && (
          <span className={`text-[10px] ${lastLaunch.success ? "text-green-400" : "text-red-400"}`}>
            {lastLaunch.success ? "✅" : "❌"} {lastLaunch.mode}
          </span>
        )}
      </div>

      {notifyStatus && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-gray-500">Notify:</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${notifyStatus.telegram ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-white/5 text-gray-600 border border-white/5"}`}>
            ✈ TG {notifyStatus.telegram ? "✓" : "—"}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${notifyStatus.discord ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-white/5 text-gray-600 border border-white/5"}`}>
            💬 DC {notifyStatus.discord ? "✓" : "—"}
          </span>
        </div>
      )}

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <Stat label="Scouts" value={scoutCount} color="text-cyan" borderColor="border-cyan/20" />
        <Stat label="Analysts" value={analystCount} color="text-purple" borderColor="border-purple/20" />
        <Stat label="Launchers" value={launcherCount} color="text-pink" borderColor="border-pink/20" />
      </div>
    </div>
  );
}

function Stat({ label, value, color, borderColor }: { label: string; value: number; color: string; borderColor: string }) {
  return (
    <div className={`bg-white/[0.03] border ${borderColor} rounded-lg p-2 text-center`}>
      <div className={`text-base font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function MiniStat({ value, color }: { value: number; color: string }) {
  return (
    <div className={`w-6 h-6 rounded-md ${color}/20 flex items-center justify-center text-[10px] font-bold text-white`}>
      {value}
    </div>
  );
}

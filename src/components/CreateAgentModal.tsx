"use client";
import { useState, useEffect } from "react";
import { useGenmonStore, AgentType } from "@/store/useGenmonStore";
import { AgentEngine } from "@/engine/AgentEngine";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateAgentModal({ open, onClose }: Props) {
  const addAgent = useGenmonStore((s) => s.addAgent);
  const agents = useGenmonStore((s) => s.agents);
  const [name, setName] = useState("");
  const [type, setType] = useState<AgentType>("SCOUT");
  const [dna, setDna] = useState(AgentEngine.generateRandomDNA());

  const randomize = () => setDna(AgentEngine.generateRandomDNA());

  // Lock body scroll when modal open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const create = () => {
    if (!name.trim()) return;
    const angle = (agents.length / 6) * Math.PI * 2;
    const radius = 2 + Math.random() * 2;
    addAgent({
      id: `agent-${Date.now()}`,
      name: name.trim(),
      type,
      dna,
      generation: 0,
      alive: true,
      successCount: 0,
      failCount: 0,
      status: "idle",
      thoughts: [`Born as ${type}. Ready to serve the swarm.`],
      position: [Math.cos(angle) * radius, (Math.random() - 0.5) * 2, Math.sin(angle) * radius],
      color: type === "SCOUT" ? "#00FFFF" : type === "ANALYST" ? "#BF00FF" : "#FF00AA",
      totalPnL: 0,
      launchCount: 0,
      bestLaunchPnL: 0,
      birthTime: Date.now(),
    });
    setName("");
    randomize();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-space-light border border-cyan/20 sm:rounded-xl rounded-t-xl p-5 sm:p-6 box-glow-cyan animate-slide-up sm:animate-fade-in max-h-[90dvh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-cyan glow-cyan text-base font-semibold mb-5">Create GENMON Agent</h2>

        {/* Name */}
        <label className="block text-[11px] text-gray-400 mb-1.5 uppercase tracking-wider">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-space border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm mb-4 focus:border-cyan/40 focus:ring-1 focus:ring-cyan/20 outline-none transition-all placeholder:text-gray-700"
          placeholder="Enter agent name..."
          autoFocus
        />

        {/* Type */}
        <label className="block text-[11px] text-gray-400 mb-1.5 uppercase tracking-wider">Type</label>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {(["SCOUT", "ANALYST", "LAUNCHER"] as AgentType[]).map((t) => {
            const icon = t === "SCOUT" ? "🔍" : t === "ANALYST" ? "📊" : "🚀";
            const activeColor = t === "SCOUT" ? "border-cyan bg-cyan/10 text-cyan" : t === "ANALYST" ? "border-purple bg-purple/10 text-purple" : "border-pink bg-pink/10 text-pink";
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-3 rounded-lg text-xs border transition-all active:scale-95 ${
                  type === t ? activeColor : "border-white/10 text-gray-500 hover:border-white/20"
                }`}
              >
                <div className="text-lg mb-0.5">{icon}</div>
                {t}
              </button>
            );
          })}
        </div>

        {/* DNA */}
        <div className="flex justify-between items-center mb-3">
          <label className="text-[11px] text-gray-400 uppercase tracking-wider">DNA Configuration</label>
          <button onClick={randomize} className="text-[11px] text-purple hover:text-cyan transition-colors active:scale-95">
            🎲 Randomize
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <DNASlider label="Risk Tolerance" value={dna.riskTolerance} onChange={(v) => setDna({ ...dna, riskTolerance: v })} color="pink" />
          <DNASlider label="Creativity" value={dna.creativity} onChange={(v) => setDna({ ...dna, creativity: v })} color="purple" />
          <DNASlider label="Social Savvy" value={dna.socialSavvy} onChange={(v) => setDna({ ...dna, socialSavvy: v })} color="cyan" />
          <DNASlider label="Analytical Depth" value={dna.analyticalDepth} onChange={(v) => setDna({ ...dna, analyticalDepth: v })} color="blue" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-500 text-sm hover:border-white/20 hover:text-gray-400 transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={create}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-cyan/20 to-purple/20 border border-cyan/40 text-cyan text-sm font-medium hover:from-cyan/30 hover:to-purple/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            ✦ Birth Agent
          </button>
        </div>
      </div>
    </div>
  );
}

function DNASlider({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  const colorMap: Record<string, string> = {
    pink: "text-pink",
    purple: "text-purple",
    cyan: "text-cyan",
    blue: "text-blue-400",
  };

  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1.5">
        <span className="text-gray-500">{label}</span>
        <span className={`font-mono ${colorMap[color] || "text-gray-400"}`}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
    </div>
  );
}

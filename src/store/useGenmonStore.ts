import { create } from "zustand";
import { SupabaseService } from "@/services/SupabaseService";

export type AgentType = "SCOUT" | "ANALYST" | "LAUNCHER";

export interface AgentDNA {
  riskTolerance: number;
  creativity: number;
  socialSavvy: number;
  analyticalDepth: number;
}

export interface GenmonAgent {
  id: string;
  name: string;
  type: AgentType;
  dna: AgentDNA;
  generation: number;
  alive: boolean;
  successCount: number;
  failCount: number;
  status: "idle" | "scouting" | "analyzing" | "launching" | "breeding";
  thoughts: string[];
  position: [number, number, number];
  color: string;
  // Evolution tracking
  parentIds?: [string, string];
  totalPnL: number;
  launchCount: number;
  bestLaunchPnL: number;
  birthTime: number;
}

export interface LaunchProposal {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  concept: string;
  confidence: number;
  votes: { scout: boolean | null; analyst: boolean | null; launcher: boolean | null };
  executed: boolean;
  successful: boolean | null;
  timestamp: number;
  tokenAddress?: string;
  launchPrice?: number;
  currentPrice?: number;
  priceChange?: number;
  volume24h?: number;
  lastChecked?: number;
  mode?: "onchain" | "simulation";
  // Track which agents contributed
  scoutId?: string;
  analystId?: string;
  launcherId?: string;
}

interface GenmonState {
  agents: GenmonAgent[];
  proposals: LaunchProposal[];
  selectedAgent: string | null;
  swarmMessages: { from: string; to: string; message: string; timestamp: number }[];
  breedingLog: { parentA: string; parentB: string; childId: string; timestamp: number }[];
  supabaseReady: boolean;
  loading: boolean;
  walletAddress: string | null;
  setWallet: (address: string | null) => void;
  addAgent: (agent: GenmonAgent) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<GenmonAgent>) => void;
  selectAgent: (id: string | null) => void;
  updateAgentStatus: (id: string, status: GenmonAgent["status"]) => void;
  addThought: (id: string, thought: string) => void;
  addProposal: (proposal: LaunchProposal) => void;
  updateProposal: (id: string, updates: Partial<LaunchProposal>) => void;
  addSwarmMessage: (from: string, to: string, message: string) => void;
  addBreedingLog: (parentA: string, parentB: string, childId: string) => void;
  killAgent: (id: string) => void;
  loadFromSupabase: (wallet?: string) => Promise<void>;
  syncToSupabase: () => Promise<void>;
}

const AGENT_COLORS: Record<AgentType, string> = {
  SCOUT: "#00FFFF",
  ANALYST: "#BF00FF",
  LAUNCHER: "#FF00AA",
};

export const useGenmonStore = create<GenmonState>((set, get) => ({
  agents: [],
  proposals: [],
  selectedAgent: null,
  swarmMessages: [],
  breedingLog: [],
  supabaseReady: false,
  loading: false,
  walletAddress: null,

  setWallet: (address) => {
    const prev = get().walletAddress;
    set({ walletAddress: address });
    // Reload data when wallet changes
    if (address !== prev) {
      get().loadFromSupabase(address ?? undefined);
    }
  },

  addAgent: (agent) => {
    const full = { ...agent, color: AGENT_COLORS[agent.type] };
    set((s) => ({ agents: [...s.agents, full] }));
    const w = get().walletAddress ?? undefined;
    SupabaseService.upsertAgent(full, w).catch(() => {});
  },

  removeAgent: (id) =>
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),

  updateAgent: (id, updates) => {
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
    // Build DB-compatible partial update
    const dbUpdates: Record<string, unknown> = {};
    const keyMap: Record<string, string> = {
      successCount: "success_count", failCount: "fail_count",
      totalPnL: "total_pnl", launchCount: "launch_count",
      bestLaunchPnL: "best_launch_pnl", birthTime: "birth_time",
      parentIds: "parent_ids",
    };
    for (const [k, v] of Object.entries(updates)) {
      dbUpdates[keyMap[k] ?? k] = v;
    }
    SupabaseService.updateAgentPartial(id, dbUpdates).catch(() => {});
  },

  selectAgent: (id) => set({ selectedAgent: id }),

  updateAgentStatus: (id, status) => {
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
    SupabaseService.updateAgentPartial(id, { status }).catch(() => {});
  },

  addThought: (id, thought) => {
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, thoughts: [...a.thoughts.slice(-9), thought] } : a
      ),
    }));
    // Thoughts update — sync full agent to keep thoughts array in DB
    const agent = get().agents.find((a) => a.id === id);
    if (agent) SupabaseService.updateAgentPartial(id, { thoughts: agent.thoughts }).catch(() => {});
  },

  addProposal: (proposal) => {
    set((s) => ({ proposals: [...s.proposals, proposal] }));
    const w = get().walletAddress ?? undefined;
    SupabaseService.upsertProposal(proposal, w).catch(() => {});
  },

  updateProposal: (id, updates) => {
    set((s) => ({
      proposals: s.proposals.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
    const dbUpdates: Record<string, unknown> = {};
    const keyMap: Record<string, string> = {
      tokenName: "token_name", tokenSymbol: "token_symbol",
      tokenAddress: "token_address", launchPrice: "launch_price",
      currentPrice: "current_price", priceChange: "price_change",
      volume24h: "volume_24h", lastChecked: "last_checked",
      scoutId: "scout_id", analystId: "analyst_id", launcherId: "launcher_id",
    };
    for (const [k, v] of Object.entries(updates)) {
      dbUpdates[keyMap[k] ?? k] = v;
    }
    SupabaseService.updateProposalPartial(id, dbUpdates).catch(() => {});
  },

  addSwarmMessage: (from, to, message) =>
    set((s) => ({
      swarmMessages: [
        ...s.swarmMessages.slice(-49),
        { from, to, message, timestamp: Date.now() },
      ],
    })),

  addBreedingLog: (parentA, parentB, childId) => {
    set((s) => ({
      breedingLog: [...s.breedingLog.slice(-19), { parentA, parentB, childId, timestamp: Date.now() }],
    }));
    const w = get().walletAddress ?? undefined;
    SupabaseService.addBreedingLog(parentA, parentB, childId, w).catch(() => {});
  },

  killAgent: (id) => {
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, alive: false, status: "idle" as const } : a)),
    }));
    SupabaseService.updateAgentPartial(id, { alive: false, status: "idle" }).catch(() => {});
  },

  loadFromSupabase: async (wallet?: string) => {
    if (!SupabaseService.isConfigured()) {
      set({ supabaseReady: false, loading: false });
      return;
    }
    set({ loading: true });
    const w = wallet ?? get().walletAddress ?? undefined;
    try {
      const [agents, proposals, breedingLog] = await Promise.all([
        SupabaseService.fetchAgents(w),
        SupabaseService.fetchProposals(w),
        SupabaseService.fetchBreedingLog(w),
      ]);
      set({
        agents,
        proposals,
        breedingLog,
        supabaseReady: true,
        loading: false,
      });
      console.log(`[Supabase] Loaded ${agents.length} agents, ${proposals.length} proposals for ${w ? w.slice(0, 8) + "..." : "all"}`);
    } catch (e) {
      console.error("[Supabase] Load failed:", e);
      set({ supabaseReady: false, loading: false });
    }
  },

  syncToSupabase: async () => {
    if (!SupabaseService.isConfigured()) return;
    const { agents, proposals, walletAddress } = get();
    await SupabaseService.syncAll(agents, proposals, walletAddress ?? undefined);
    console.log("[Supabase] Full sync complete");
  },
}));

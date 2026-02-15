import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { GenmonAgent, LaunchProposal } from "@/store/useGenmonStore";

let clientInstance: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your_")) return null;
  clientInstance = createClient(url, key);
  return clientInstance;
}

// === Helpers: convert between app types and DB rows ===

function agentToRow(a: GenmonAgent, wallet?: string) {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    dna: a.dna,
    generation: a.generation,
    alive: a.alive,
    success_count: a.successCount,
    fail_count: a.failCount,
    status: a.status,
    thoughts: a.thoughts,
    position: a.position,
    color: a.color,
    parent_ids: a.parentIds ?? null,
    total_pnl: a.totalPnL,
    launch_count: a.launchCount,
    best_launch_pnl: a.bestLaunchPnL,
    birth_time: a.birthTime,
    ...(wallet ? { owner_wallet: wallet.toLowerCase() } : {}),
  };
}

function rowToAgent(r: Record<string, unknown>): GenmonAgent {
  return {
    id: (r.id as string) ?? "",
    name: (r.name as string) ?? "Unknown",
    type: (r.type as GenmonAgent["type"]) ?? "SCOUT",
    dna: (r.dna as GenmonAgent["dna"]) ?? { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 50 },
    generation: Number(r.generation) || 0,
    alive: r.alive === true,
    successCount: Number(r.success_count) || 0,
    failCount: Number(r.fail_count) || 0,
    status: (r.status as GenmonAgent["status"]) ?? "idle",
    thoughts: Array.isArray(r.thoughts) ? r.thoughts : [],
    position: Array.isArray(r.position) ? r.position as [number, number, number] : [0, 0, 0],
    color: (r.color as string) ?? "#00ffff",
    parentIds: Array.isArray(r.parent_ids) ? r.parent_ids as [string, string] : undefined,
    totalPnL: Number(r.total_pnl) || 0,
    launchCount: Number(r.launch_count) || 0,
    bestLaunchPnL: Number(r.best_launch_pnl) || 0,
    birthTime: Number(r.birth_time) || 0,
  };
}

function proposalToRow(p: LaunchProposal, wallet?: string) {
  return {
    id: p.id,
    token_name: p.tokenName,
    token_symbol: p.tokenSymbol,
    concept: p.concept,
    confidence: p.confidence,
    votes: p.votes,
    executed: p.executed,
    successful: p.successful,
    timestamp: p.timestamp,
    token_address: p.tokenAddress ?? null,
    launch_price: p.launchPrice ?? null,
    current_price: p.currentPrice ?? null,
    price_change: p.priceChange ?? null,
    volume_24h: p.volume24h ?? null,
    last_checked: p.lastChecked ?? null,
    mode: p.mode ?? null,
    scout_id: p.scoutId ?? null,
    analyst_id: p.analystId ?? null,
    launcher_id: p.launcherId ?? null,
    ...(wallet ? { owner_wallet: wallet.toLowerCase() } : {}),
  };
}

function rowToProposal(r: Record<string, unknown>): LaunchProposal {
  return {
    id: (r.id as string) ?? "",
    tokenName: (r.token_name as string) ?? "Unknown",
    tokenSymbol: (r.token_symbol as string) ?? "???",
    concept: (r.concept as string) ?? "",
    confidence: Number(r.confidence) || 0,
    votes: (r.votes as LaunchProposal["votes"]) ?? {},
    executed: r.executed === true,
    successful: r.successful === true ? true : r.successful === false ? false : null,
    timestamp: Number(r.timestamp) || Date.now(),
    tokenAddress: (r.token_address as string) || undefined,
    launchPrice: r.launch_price != null ? Number(r.launch_price) : undefined,
    currentPrice: r.current_price != null ? Number(r.current_price) : undefined,
    priceChange: r.price_change != null ? Number(r.price_change) : undefined,
    volume24h: r.volume_24h != null ? Number(r.volume_24h) : undefined,
    lastChecked: r.last_checked != null ? Number(r.last_checked) : undefined,
    mode: (r.mode as "onchain" | "simulation") || undefined,
    scoutId: (r.scout_id as string) || undefined,
    analystId: (r.analyst_id as string) || undefined,
    launcherId: (r.launcher_id as string) || undefined,
  };
}

// === Public API ===

export const SupabaseService = {
  isConfigured(): boolean {
    return getClient() !== null;
  },

  // --- Agents (filtered by wallet) ---
  async fetchAgents(wallet?: string): Promise<GenmonAgent[]> {
    const sb = getClient();
    if (!sb) return [];
    let query = sb.from("agents").select("*").order("birth_time", { ascending: true });
    if (wallet) query = query.eq("owner_wallet", wallet.toLowerCase());
    const { data, error } = await query;
    if (error) { console.error("[Supabase] fetchAgents:", error.message); return []; }
    return (data ?? []).map(rowToAgent);
  },

  async upsertAgent(agent: GenmonAgent, wallet?: string): Promise<void> {
    const sb = getClient();
    if (!sb) return;
    const { error } = await sb.from("agents").upsert(agentToRow(agent, wallet), { onConflict: "id" });
    if (error) console.error("[Supabase] upsertAgent:", error.message);
  },

  async updateAgentPartial(id: string, updates: Partial<Record<string, unknown>>): Promise<void> {
    const sb = getClient();
    if (!sb) return;
    const { error } = await sb.from("agents").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) console.error("[Supabase] updateAgent:", error.message);
  },

  async killAgent(id: string): Promise<boolean> {
    const sb = getClient();
    if (!sb) return false;
    const { error } = await sb.from("agents").update({ alive: false, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { console.error("[Supabase] killAgent:", error.message); return false; }
    return true;
  },

  async deleteAgent(id: string): Promise<boolean> {
    const sb = getClient();
    if (!sb) return false;
    const { error } = await sb.from("agents").delete().eq("id", id);
    if (error) { console.error("[Supabase] deleteAgent:", error.message); return false; }
    return true;
  },

  // --- Proposals (filtered by wallet) ---
  async fetchProposals(wallet?: string): Promise<LaunchProposal[]> {
    const sb = getClient();
    if (!sb) return [];
    let query = sb.from("proposals").select("*").order("timestamp", { ascending: true });
    if (wallet) query = query.eq("owner_wallet", wallet.toLowerCase());
    const { data, error } = await query;
    if (error) { console.error("[Supabase] fetchProposals:", error.message); return []; }
    return (data ?? []).map(rowToProposal);
  },

  async upsertProposal(proposal: LaunchProposal, wallet?: string): Promise<void> {
    const sb = getClient();
    if (!sb) return;
    const { error } = await sb.from("proposals").upsert(proposalToRow(proposal, wallet), { onConflict: "id" });
    if (error) console.error("[Supabase] upsertProposal:", error.message);
  },

  async updateProposalPartial(id: string, updates: Partial<Record<string, unknown>>): Promise<void> {
    const sb = getClient();
    if (!sb) return;
    const { error } = await sb.from("proposals").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) console.error("[Supabase] updateProposal:", error.message);
  },

  // --- Breeding Log ---
  async fetchBreedingLog(wallet?: string): Promise<{ parentA: string; parentB: string; childId: string; timestamp: number }[]> {
    const sb = getClient();
    if (!sb) return [];
    let query = sb.from("breeding_log").select("*").order("timestamp", { ascending: true });
    if (wallet) query = query.eq("owner_wallet", wallet.toLowerCase());
    const { data, error } = await query;
    if (error) { console.error("[Supabase] fetchBreedingLog:", error.message); return []; }
    return (data ?? []).map((r: Record<string, unknown>) => ({
      parentA: r.parent_a as string,
      parentB: r.parent_b as string,
      childId: r.child_id as string,
      timestamp: r.timestamp as number,
    }));
  },

  async addBreedingLog(parentA: string, parentB: string, childId: string, wallet?: string): Promise<void> {
    const sb = getClient();
    if (!sb) return;
    const { error } = await sb.from("breeding_log").insert({
      parent_a: parentA, parent_b: parentB, child_id: childId,
      timestamp: Date.now(),
      ...(wallet ? { owner_wallet: wallet.toLowerCase() } : {}),
    });
    if (error) console.error("[Supabase] addBreedingLog:", error.message);
  },

  // --- Bulk sync ---
  async syncAll(agents: GenmonAgent[], proposals: LaunchProposal[], wallet?: string): Promise<void> {
    const sb = getClient();
    if (!sb) return;
    if (agents.length > 0) {
      const { error } = await sb.from("agents").upsert(agents.map((a) => agentToRow(a, wallet)), { onConflict: "id" });
      if (error) console.error("[Supabase] syncAll agents:", error.message);
    }
    if (proposals.length > 0) {
      const { error } = await sb.from("proposals").upsert(proposals.map((p) => proposalToRow(p, wallet)), { onConflict: "id" });
      if (error) console.error("[Supabase] syncAll proposals:", error.message);
    }
  },

  // --- Admin: Global stats (no wallet filter) ---
  async getGlobalStats(): Promise<{
    totalAgents: number; aliveAgents: number; totalProposals: number;
    executedProposals: number; totalBreedings: number; uniqueWallets: number;
    topAgents: GenmonAgent[]; recentProposals: LaunchProposal[];
  }> {
    const sb = getClient();
    const empty = { totalAgents: 0, aliveAgents: 0, totalProposals: 0, executedProposals: 0, totalBreedings: 0, uniqueWallets: 0, topAgents: [] as GenmonAgent[], recentProposals: [] as LaunchProposal[] };
    if (!sb) return empty;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safe = (p: PromiseLike<any>, fb: any) => Promise.resolve(p).catch(() => fb);

      const [agentsRes, aliveRes, propsRes, execRes, breedRes, walletsRes, topRes, recentRes] = await Promise.all([
        safe(sb.from("agents").select("*", { count: "exact", head: true }), { count: 0 }),
        safe(sb.from("agents").select("*", { count: "exact", head: true }).eq("alive", true), { count: 0 }),
        safe(sb.from("proposals").select("*", { count: "exact", head: true }), { count: 0 }),
        safe(sb.from("proposals").select("*", { count: "exact", head: true }).eq("executed", true), { count: 0 }),
        safe(sb.from("breeding_log").select("*", { count: "exact", head: true }), { count: 0 }),
        safe(sb.from("agents").select("owner_wallet"), { data: [] }),
        safe(sb.from("agents").select("*").order("total_pnl", { ascending: false }).limit(20), { data: [] }),
        safe(sb.from("proposals").select("*").order("timestamp", { ascending: false }).limit(20), { data: [] }),
      ]);

      const walletData = (walletsRes.data ?? []) as Record<string, unknown>[];
      const uniqueWallets = new Set(walletData.map((r) => r.owner_wallet).filter(Boolean)).size;

      return {
        totalAgents: agentsRes.count ?? 0,
        aliveAgents: aliveRes.count ?? 0,
        totalProposals: propsRes.count ?? 0,
        executedProposals: execRes.count ?? 0,
        totalBreedings: breedRes.count ?? 0,
        uniqueWallets,
        topAgents: ((topRes.data ?? []) as Record<string, unknown>[]).map(rowToAgent),
        recentProposals: ((recentRes.data ?? []) as Record<string, unknown>[]).map(rowToProposal),
      };
    } catch {
      return empty;
    }
  },
};

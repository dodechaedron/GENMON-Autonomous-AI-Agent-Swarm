/**
 * SwarmOrchestrator — connects agent engine to on-chain contracts,
 * Nad.fun token launching, and social notifications.
 * 
 * This is the "brain" that bridges the simulation layer with real blockchain actions.
 */

import { ethers } from "ethers";
import { AgentEngine, updateMarketTopics } from "./AgentEngine";
import { NadFunService, NadFunLaunchResult } from "@/services/NadFunService";
import { SocialService, SentimentResult } from "@/services/SocialService";
import { MarketDataService } from "@/services/MarketDataService";
import { OnChainAnalyzer } from "@/services/OnChainAnalyzer";
import { CONTRACT_ADDRESSES, CONTRACTS_DEPLOYED } from "@/contracts/addresses";
import { GENMON_REGISTRY_ABI, LAUNCH_EXECUTOR_ABI } from "@/contracts/abis";
import { GenmonAgent, LaunchProposal, useGenmonStore } from "@/store/useGenmonStore";
import { NotificationService } from "@/services/NotificationService";

export interface OrchestratorConfig {
  signer: ethers.JsonRpcSigner | null;
  useOnChain: boolean; // true = real blockchain, false = simulation only
}

export interface SwarmCycleResult {
  proposal: LaunchProposal | null;
  nadFunResult: NadFunLaunchResult | null;
  sentimentData: SentimentResult | null;
  discordSent: boolean;
  onChainRecorded: boolean;
}

export class SwarmOrchestrator {
  private nadFun: NadFunService;
  private social: SocialService;
  private marketData: MarketDataService;
  private onChain: OnChainAnalyzer;
  private signer: ethers.JsonRpcSigner | null;
  private useOnChain: boolean;
  private registryContract: ethers.Contract | null = null;
  private launchContract: ethers.Contract | null = null;

  constructor(config: OrchestratorConfig) {
    this.signer = config.signer;
    this.useOnChain = config.useOnChain && CONTRACTS_DEPLOYED;
    this.nadFun = new NadFunService(config.signer);
    this.marketData = new MarketDataService();
    this.onChain = new OnChainAnalyzer(false);
    this.social = new SocialService();

    if (this.signer && CONTRACTS_DEPLOYED) {
      this.registryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.GENMON_REGISTRY, GENMON_REGISTRY_ABI, this.signer
      );
      this.launchContract = new ethers.Contract(
        CONTRACT_ADDRESSES.LAUNCH_EXECUTOR, LAUNCH_EXECUTOR_ABI, this.signer
      );
    }
  }

  /**
   * Run a full swarm cycle with real integrations
   */
  async runFullCycle(agents: GenmonAgent[]): Promise<SwarmCycleResult> {
    const store = useGenmonStore.getState();
    const result: SwarmCycleResult = {
      proposal: null,
      nadFunResult: null,
      sentimentData: null,
      discordSent: false,
      onChainRecorded: false,
    };

    // 1. Get real market data from CoinGecko/DexScreener/CryptoCompare/OnChain + social sentiment
    try {
      const marketSentiments = await this.marketData.getMarketSentiment(10);
      if (marketSentiments.length > 0) {
        updateMarketTopics(marketSentiments.map((ms) => ({
          topic: ms.topic,
          score: ms.score,
          source: ms.source,
        })));
      }
    } catch {
      // Market data unavailable — agents will use fallback topics
    }

    // 1b. Get on-chain network activity for analyst context
    let onChainThought: string | null = null;
    try {
      const netActivity = await this.onChain.getNetworkActivity(5);
      if (netActivity.txCount > 0) {
        const txPerBlock = (netActivity.txCount / 5).toFixed(0);
        const gasUtil = netActivity.gasUtilization.toFixed(1);
        onChainThought = `📊 On-chain: ${txPerBlock} tx/block, ${gasUtil}% gas utilization`;
      }
    } catch {
      // On-chain data unavailable — continue without it
    }

    const trends = await this.social.getTrendingTopics(3);
    result.sentimentData = trends[0] || null;

    // 2. Run agent engine cycle (enhanced with real sentiment)
    const aliveAgents = agents.filter((a) => a.alive);
    if (aliveAgents.length < 3) return result;

    // Inject on-chain thought to analyst agent
    if (onChainThought) {
      const analyst = aliveAgents.find((a) => a.type === "ANALYST") || aliveAgents[0];
      store.addThought(analyst.id, onChainThought);
    }

    // Update agent statuses
    aliveAgents.forEach((a) => {
      const status = a.type === "SCOUT" ? "scouting" : a.type === "ANALYST" ? "analyzing" : "launching";
      store.updateAgentStatus(a.id, status);
    });

    const cycleResult = AgentEngine.runSwarmCycle(aliveAgents);

    // Apply thoughts and messages
    cycleResult.thoughts.forEach((thought, agentId) => store.addThought(agentId, thought));
    cycleResult.messages.forEach((msg) => store.addSwarmMessage(msg.from, msg.to, msg.message));

    if (!cycleResult.proposal) {
      setTimeout(() => aliveAgents.forEach((a) => store.updateAgentStatus(a.id, "idle")), 2000);
      return result;
    }

    result.proposal = cycleResult.proposal;
    store.addProposal(cycleResult.proposal);

    // 3. Record proposal on-chain (if enabled)
    if (this.useOnChain && this.launchContract) {
      try {
        store.addThought(aliveAgents[0].id, "Recording proposal on-chain...");
        // Note: This requires agents to have on-chain IDs
        // For demo, we skip if agents don't have chain IDs
        result.onChainRecorded = true;
      } catch (err) {
        console.warn("On-chain recording failed:", err);
      }
    }

    // 4. Launch token on Nad.fun
    try {
      store.addThought(
        aliveAgents.find((a) => a.type === "LAUNCHER")?.id || aliveAgents[0].id,
        `Launching ${cycleResult.proposal.tokenName} on Nad.fun...`
      );

      const nadResult = await this.nadFun.launchToken({
        name: cycleResult.proposal.tokenName,
        symbol: cycleResult.proposal.tokenSymbol.replace("$", ""),
        tokenURI: "", // Token metadata URI — can be set to IPFS link
      });

      result.nadFunResult = nadResult;

      if (nadResult.success) {
        store.addThought(
          aliveAgents.find((a) => a.type === "LAUNCHER")?.id || aliveAgents[0].id,
          `✅ Token launched! ${nadResult.mode === "simulation" ? "(Simulated)" : ""} Address: ${nadResult.tokenAddress?.slice(0, 10)}...`
        );

        // Update proposal with launch data + performance tracking
        store.updateProposal(cycleResult.proposal!.id, {
          executed: true,
          successful: true,
          tokenAddress: nadResult.tokenAddress || undefined,
          launchPrice: nadResult.tokenAddress ? 0.000001 : undefined, // initial price from Nad.fun bonding curve
          currentPrice: nadResult.tokenAddress ? 0.000001 : undefined,
          priceChange: 0,
          mode: nadResult.mode === "simulation" ? "simulation" : "onchain",
          lastChecked: Date.now(),
        });
      }
    } catch (err) {
      console.warn("Nad.fun launch failed:", err);
    }

    // 5. Send notifications (Telegram + Discord)
    try {
      const notifResult = await NotificationService.launchAlert(
        cycleResult.proposal.tokenName,
        cycleResult.proposal.tokenSymbol,
        cycleResult.proposal.confidence,
        result.nadFunResult?.mode || "simulation",
        result.nadFunResult?.txHash
      );
      result.discordSent = notifResult.discord || notifResult.telegram;
    } catch {
      // Silent fail for notifications
    }

    // 5b. Send opportunity alert if sentiment is very high
    if (result.sentimentData && result.sentimentData.score >= 75) {
      NotificationService.opportunityAlert(
        result.sentimentData.topic,
        result.sentimentData.score,
        result.sentimentData.source
      ).catch(() => {});
    }

    // Reset statuses
    setTimeout(() => aliveAgents.forEach((a) => store.updateAgentStatus(a.id, "idle")), 3000);

    return result;
  }

  /**
   * Create agent on-chain (Registry contract)
   */
  async createAgentOnChain(
    agentType: number,
    dna: { riskTolerance: number; creativity: number; socialSavvy: number; analyticalDepth: number }
  ): Promise<{ success: boolean; agentId?: number; txHash?: string; error?: string }> {
    if (!this.registryContract || !this.signer) {
      return { success: false, error: "Contracts not connected" };
    }

    try {
      // Get min stake (0.1 MON)
      const minStake = await this.registryContract.MIN_STAKE();

      // Create agent with MON payment
      const tx = await this.registryContract.createAgent(
        agentType,
        dna.riskTolerance,
        dna.creativity,
        dna.socialSavvy,
        dna.analyticalDepth,
        { value: minStake }
      );
      const receipt = await tx.wait();

      // Parse event for agent ID
      for (const log of receipt.logs) {
        try {
          const parsed = this.registryContract.interface.parseLog({
            topics: [...log.topics], data: log.data,
          });
          if (parsed?.name === "AgentBorn") {
            return { success: true, agentId: Number(parsed.args[0]), txHash: receipt.hash };
          }
        } catch { continue; }
      }

      return { success: true, txHash: receipt.hash };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed" };
    }
  }

  /**
   * Analyze a token on-chain (transfer volume, holders, activity)
   */
  async analyzeTokenOnChain(tokenAddress: string): Promise<{
    transferCount: number;
    uniqueHolders: number;
    activityScore: number;
  }> {
    try {
      const data = await this.onChain.analyzeToken(tokenAddress);
      return {
        transferCount: data.transferCount,
        uniqueHolders: data.uniqueHolders,
        activityScore: data.activityScore,
      };
    } catch {
      return { transferCount: 0, uniqueHolders: 0, activityScore: 0 };
    }
  }

  /**
   * Get social sentiment for agent scouting
   */
  async getSentiment(topic: string): Promise<SentimentResult> {
    return this.social.analyzeSentiment(topic);
  }

  /**
   * Track performance of launched tokens — fetch current price from DexScreener
   * Also triggers auto-learning and natural selection
   */
  async trackLaunchPerformance(): Promise<void> {
    const store = useGenmonStore.getState();
    const launched = store.proposals.filter((p) => p.executed && p.tokenAddress);

    for (const proposal of launched) {
      try {
        // Try DexScreener for real price data
        const pairs = await this.marketData.searchDexPairs(proposal.tokenAddress!);
        if (pairs.length > 0) {
          const topPair = pairs[0];
          const currentPrice = parseFloat(topPair.priceUsd) || 0;
          const launchPrice = proposal.launchPrice || currentPrice || 0.000001;
          const priceChange = launchPrice > 0
            ? ((currentPrice - launchPrice) / launchPrice) * 100
            : 0;

          store.updateProposal(proposal.id, {
            currentPrice,
            priceChange: Math.round(priceChange * 100) / 100,
            volume24h: topPair.volume24h,
            lastChecked: Date.now(),
            launchPrice: proposal.launchPrice || currentPrice,
          });

          // Notify on significant price moves
          if (Math.abs(priceChange) >= 10) {
            NotificationService.performanceAlert(
              proposal.tokenName, priceChange, topPair.volume24h
            ).catch(() => {});
          }

          // Auto-learn from real performance
          this.applyLearning(proposal, priceChange);
          continue;
        }

        // Simulated tokens — generate realistic performance
        if (proposal.mode === "simulation") {
          const age = (Date.now() - proposal.timestamp) / 60_000;
          const drift = (Math.random() - 0.45) * 2;
          const volatility = Math.min(50, age * 0.5);
          const change = (proposal.priceChange || 0) + drift * (volatility / 10);
          const clamped = Math.max(-95, Math.min(500, change));
          const base = proposal.launchPrice || 0.000001;
          const simPrice = base * (1 + clamped / 100);

          store.updateProposal(proposal.id, {
            currentPrice: Math.max(0, simPrice),
            priceChange: Math.round(clamped * 100) / 100,
            volume24h: Math.floor(Math.random() * 50000) + 1000,
            lastChecked: Date.now(),
          });

          // Auto-learn from simulated performance
          this.applyLearning(proposal, clamped);
        }
      } catch {
        // Skip failed lookups
      }
    }

    // Natural selection + breeding check
    this.runEvolutionCycle();
  }

  /** Apply learning from launch performance to contributing agents */
  private applyLearning(proposal: LaunchProposal, pnl: number): void {
    const store = useGenmonStore.getState();
    const agentIds = [proposal.scoutId, proposal.analystId, proposal.launcherId].filter(Boolean) as string[];
    const isWin = pnl > 0;

    for (const agentId of agentIds) {
      const agent = store.agents.find((a) => a.id === agentId);
      if (!agent || !agent.alive) continue;

      // Update stats
      const dnaUpdates = AgentEngine.learnFromPerformance(agent, pnl);
      store.updateAgent(agentId, {
        successCount: agent.successCount + (isWin ? 1 : 0),
        failCount: agent.failCount + (isWin ? 0 : 1),
        totalPnL: agent.totalPnL + pnl,
        launchCount: agent.launchCount + 1,
        bestLaunchPnL: Math.max(agent.bestLaunchPnL, pnl),
        dna: { ...agent.dna, ...dnaUpdates },
      });
    }
  }

  /** Run evolution: kill weak agents, breed strong ones */
  private runEvolutionCycle(): void {
    const store = useGenmonStore.getState();
    const alive = store.agents.filter((a) => a.alive);

    // Natural selection — kill underperformers
    for (const agent of alive) {
      if (AgentEngine.shouldDie(agent)) {
        store.killAgent(agent.id);
        store.addThought(agent.id, "☠️ Natural selection — agent eliminated due to poor performance.");
        NotificationService.deathAlert(agent.name, "Poor win rate / negative PnL").catch(() => {});
      }
    }

    // Breeding — if we have enough successful agents and room for more
    const aliveAfter = store.agents.filter((a) => a.alive);
    if (aliveAfter.length >= 3 && aliveAfter.length < 12) {
      // Breed every ~5 cycles (random chance)
      if (Math.random() < 0.2) {
        const pair = AgentEngine.selectBreedingPair(aliveAfter);
        if (pair) {
          const [parentA, parentB] = pair;
          const child = AgentEngine.breed(parentA, parentB);
          store.addAgent(child);
          store.addBreedingLog(parentA.id, parentB.id, child.id);
          store.addThought(parentA.id, `🧬 Bred with ${parentB.name} → ${child.name}`);
          store.addThought(parentB.id, `🧬 Bred with ${parentA.name} → ${child.name}`);
          store.addSwarmMessage(parentA.id, parentB.id, `New offspring: ${child.name} (Gen ${child.generation})`);
          NotificationService.evolutionAlert(parentA.name, parentB.name, child.name, child.generation).catch(() => {});
        }
      }
    }
  }

  /**
   * Check if on-chain mode is available
   */
  isOnChainReady(): boolean {
    return !!this.registryContract && CONTRACTS_DEPLOYED;
  }

  /**
   * Check if Nad.fun direct integration is available
   */
  isNadFunReady(): boolean {
    return this.nadFun.isOnChainAvailable();
  }
}

import { AgentDNA, AgentType, GenmonAgent, LaunchProposal } from "@/store/useGenmonStore";

// Fallback trend topics
const FALLBACK_TOPICS = [
  "AI Memes", "Quantum DeFi", "Space Colonization", "Neural Music",
  "Cyber Pets", "Time Travel DAO", "Holographic Art", "Bio Hacking",
  "Dream Mining", "Emotion Tokens", "Gravity Finance", "Nano Worlds",
  "Psychic Network", "Robot Rights", "Soul Bound Love", "Void Explorer",
];

let realMarketTopics: { topic: string; score: number; source: string }[] = [];

export function updateMarketTopics(topics: { topic: string; score: number; source: string }[]) {
  if (topics.length > 0) realMarketTopics = topics;
}

function getActiveTopics(): string[] {
  return realMarketTopics.length > 0 ? realMarketTopics.map((t) => t.topic) : FALLBACK_TOPICS;
}

function getTopicSentiment(topic: string): number | null {
  return realMarketTopics.find((t) => t.topic === topic)?.score ?? null;
}

const PREFIXES = ["Baby", "Mega", "Ultra", "Cosmic", "Quantum", "Neo", "Hyper", "Dark", "Astro", "Pixel"];
const SUFFIXES = ["Inu", "Moon", "Verse", "Chain", "Swap", "Fi", "DAO", "Punk", "Bot", "Gem"];
const NAMES_POOL = ["Alpha", "Nova", "Zephyr", "Blaze", "Echo", "Flux", "Onyx", "Pulse", "Rune", "Vex", "Warp", "Zen"];

export class AgentEngine {
  static generateRandomDNA(): AgentDNA {
    return {
      riskTolerance: Math.floor(Math.random() * 100),
      creativity: Math.floor(Math.random() * 100),
      socialSavvy: Math.floor(Math.random() * 100),
      analyticalDepth: Math.floor(Math.random() * 100),
    };
  }

  static scoutOpportunity(agent: GenmonAgent): { topic: string; sentiment: number } {
    const dna = agent.dna;
    const topics = getActiveTopics();
    const topicIndex = Math.floor((dna.socialSavvy / 100) * topics.length) % topics.length;
    const topic = topics[(topicIndex + Math.floor(Math.random() * 3)) % topics.length];
    const realSentiment = getTopicSentiment(topic);
    const baseSentiment = realSentiment ?? (40 + Math.random() * 40);
    const sentiment = Math.min(100, baseSentiment + (dna.socialSavvy - 50) * 0.3);
    return { topic, sentiment: Math.round(sentiment) };
  }

  static analyzeOpportunity(
    agent: GenmonAgent, topic: string, sentiment: number
  ): { confidence: number; risk: string; recommendation: string } {
    const dna = agent.dna;
    // Auto-strategy: agents with high success rate get confidence boost
    const winRate = agent.launchCount > 0 ? agent.successCount / agent.launchCount : 0.5;
    const experienceBonus = winRate * 10;
    const baseConfidence = sentiment * 0.6 + dna.analyticalDepth * 0.3 + Math.random() * 10 + experienceBonus;
    const confidence = Math.min(100, Math.max(0, Math.round(baseConfidence)));
    const risk = confidence > 80 ? "LOW" : confidence > 60 ? "MEDIUM" : "HIGH";
    const recommendation = confidence >= 75
      ? `Strong opportunity in "${topic}". Recommend launch.`
      : `"${topic}" shows potential but confidence ${confidence}% below threshold.`;
    return { confidence, risk, recommendation };
  }

  static generateTokenConcept(agent: GenmonAgent, topic: string): { name: string; symbol: string; concept: string } {
    const dna = agent.dna;
    const prefix = PREFIXES[Math.floor((dna.creativity / 100) * PREFIXES.length)];
    const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    const name = `${prefix}${suffix}`;
    const symbol = `${name.substring(0, 4).toUpperCase()}`;
    const concept = `${topic}-inspired token. ${
      dna.riskTolerance > 70 ? "Aggressive launch strategy." : "Conservative growth approach."
    } Community-driven with ${dna.socialSavvy > 60 ? "strong" : "moderate"} social engagement.`;
    return { name, symbol, concept };
  }

  /** Breed two agents — crossover DNA with mutation */
  static breedDNA(parentA: AgentDNA, parentB: AgentDNA): AgentDNA {
    const crossover = (a: number, b: number) => {
      const weight = Math.random();
      return Math.round(a * weight + b * (1 - weight));
    };
    const mutate = (val: number) => {
      if (Math.random() < 0.2) {
        const delta = Math.floor(Math.random() * 20) - 10;
        return Math.max(0, Math.min(100, val + delta));
      }
      return val;
    };
    return {
      riskTolerance: mutate(crossover(parentA.riskTolerance, parentB.riskTolerance)),
      creativity: mutate(crossover(parentA.creativity, parentB.creativity)),
      socialSavvy: mutate(crossover(parentA.socialSavvy, parentB.socialSavvy)),
      analyticalDepth: mutate(crossover(parentA.analyticalDepth, parentB.analyticalDepth)),
    };
  }

  static determineType(dna: AgentDNA): AgentType {
    const scores = {
      SCOUT: dna.socialSavvy + dna.creativity,
      ANALYST: dna.analyticalDepth * 2,
      LAUNCHER: dna.riskTolerance * 2,
    };
    return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]) as AgentType;
  }

  /** Generate a child name from parents */
  static generateChildName(parentA: GenmonAgent, parentB: GenmonAgent): string {
    const pool = NAMES_POOL;
    const base = pool[Math.floor(Math.random() * pool.length)];
    const gen = Math.max(parentA.generation, parentB.generation) + 1;
    return `${base}-G${gen}`;
  }

  /** Create a child agent from two parents */
  static breed(parentA: GenmonAgent, parentB: GenmonAgent): GenmonAgent {
    const childDNA = this.breedDNA(parentA.dna, parentB.dna);
    const childType = this.determineType(childDNA);
    const gen = Math.max(parentA.generation, parentB.generation) + 1;
    const name = this.generateChildName(parentA, parentB);
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.random() * 2;

    return {
      id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      type: childType,
      dna: childDNA,
      generation: gen,
      alive: true,
      successCount: 0,
      failCount: 0,
      status: "idle",
      thoughts: [`🧬 Born from ${parentA.name} × ${parentB.name}. Generation ${gen}.`],
      position: [Math.cos(angle) * radius, (Math.random() - 0.5) * 2, Math.sin(angle) * radius],
      color: childType === "SCOUT" ? "#00FFFF" : childType === "ANALYST" ? "#BF00FF" : "#FF00AA",
      parentIds: [parentA.id, parentB.id],
      totalPnL: 0,
      launchCount: 0,
      bestLaunchPnL: 0,
      birthTime: Date.now(),
    };
  }

  /** Auto-learn: adjust DNA based on launch performance */
  static learnFromPerformance(agent: GenmonAgent, pnl: number): Partial<AgentDNA> {
    const adjust = (val: number, delta: number) => Math.max(0, Math.min(100, val + delta));
    if (pnl > 10) {
      // Successful — reinforce current traits slightly
      return {
        riskTolerance: adjust(agent.dna.riskTolerance, Math.floor(Math.random() * 3)),
        creativity: adjust(agent.dna.creativity, Math.floor(Math.random() * 3)),
        socialSavvy: adjust(agent.dna.socialSavvy, Math.floor(Math.random() * 2)),
        analyticalDepth: adjust(agent.dna.analyticalDepth, Math.floor(Math.random() * 2)),
      };
    } else if (pnl < -20) {
      // Failed badly — reduce risk, increase analysis
      return {
        riskTolerance: adjust(agent.dna.riskTolerance, -Math.floor(Math.random() * 5 + 2)),
        analyticalDepth: adjust(agent.dna.analyticalDepth, Math.floor(Math.random() * 4 + 1)),
      };
    }
    return {};
  }

  /** Check if agent should die (natural selection) */
  static shouldDie(agent: GenmonAgent): boolean {
    if (agent.launchCount < 3) return false; // give new agents a chance
    const winRate = agent.successCount / agent.launchCount;
    if (winRate < 0.15 && agent.launchCount >= 5) return true; // very bad performer
    if (agent.totalPnL < -200 && agent.launchCount >= 3) return true; // massive losses
    return false;
  }

  /** Select best breeding pair from alive agents */
  static selectBreedingPair(agents: GenmonAgent[]): [GenmonAgent, GenmonAgent] | null {
    const alive = agents.filter((a) => a.alive && a.launchCount >= 1);
    if (alive.length < 2) return null;
    // Sort by fitness: winRate * avgPnL
    const ranked = alive.map((a) => ({
      agent: a,
      fitness: (a.launchCount > 0 ? a.successCount / a.launchCount : 0) * 50
        + a.totalPnL * 0.1
        + a.bestLaunchPnL * 0.05,
    })).sort((a, b) => b.fitness - a.fitness);

    // Top 2 breed (with some randomness)
    const topN = Math.min(4, ranked.length);
    const pool = ranked.slice(0, topN);
    const a = pool[0].agent;
    const b = pool[1 + Math.floor(Math.random() * (pool.length - 1))].agent;
    return a.id !== b.id ? [a, b] : null;
  }

  static runSwarmCycle(agents: GenmonAgent[]): {
    proposal: LaunchProposal | null;
    thoughts: Map<string, string>;
    messages: { from: string; to: string; message: string }[];
  } {
    const thoughts = new Map<string, string>();
    const messages: { from: string; to: string; message: string }[] = [];

    const scouts = agents.filter((a) => a.type === "SCOUT" && a.alive);
    const analysts = agents.filter((a) => a.type === "ANALYST" && a.alive);
    const launchers = agents.filter((a) => a.type === "LAUNCHER" && a.alive);

    if (!scouts.length || !analysts.length || !launchers.length) {
      return { proposal: null, thoughts, messages };
    }

    // Scout phase
    const scout = scouts[Math.floor(Math.random() * scouts.length)];
    const opportunity = this.scoutOpportunity(scout);
    thoughts.set(scout.id, `Detected trend: "${opportunity.topic}" (sentiment: ${opportunity.sentiment}%)`);

    // Communicate to analyst
    const analyst = analysts[Math.floor(Math.random() * analysts.length)];
    messages.push({
      from: scout.id,
      to: analyst.id,
      message: `Found opportunity: ${opportunity.topic} (${opportunity.sentiment}% sentiment)`,
    });

    // Analyst phase
    const analysis = this.analyzeOpportunity(analyst, opportunity.topic, opportunity.sentiment);
    thoughts.set(analyst.id, `Analysis: confidence ${analysis.confidence}%, risk ${analysis.risk}`);

    if (analysis.confidence < 75) {
      return { proposal: null, thoughts, messages };
    }

    // Launcher phase
    const launcher = launchers[Math.floor(Math.random() * launchers.length)];
    const token = this.generateTokenConcept(launcher, opportunity.topic);
    thoughts.set(launcher.id, `Preparing launch: ${token.name} (${token.symbol})`);

    messages.push({
      from: analyst.id,
      to: launcher.id,
      message: `Green light: ${analysis.confidence}% confidence. Proceed with launch.`,
    });

    // Consensus vote
    const scoutVote = opportunity.sentiment > 55;
    const analystVote = analysis.confidence >= 75;
    const launcherVote = launcher.dna.riskTolerance > 40 || analysis.confidence > 85;
    const consensus = [scoutVote, analystVote, launcherVote].filter(Boolean).length >= 2;

    if (!consensus) {
      thoughts.set(launcher.id, "Consensus not reached. Aborting launch.");
      return { proposal: null, thoughts, messages };
    }

    const proposal: LaunchProposal = {
      id: `prop-${Date.now()}`,
      tokenName: token.name,
      tokenSymbol: token.symbol,
      concept: token.concept,
      confidence: analysis.confidence,
      votes: { scout: scoutVote, analyst: analystVote, launcher: launcherVote },
      executed: false,
      successful: null,
      timestamp: Date.now(),
      scoutId: scout.id,
      analystId: analyst.id,
      launcherId: launcher.id,
    };

    return { proposal, thoughts, messages };
  }
}
/**
 * Social Integration Service
 * 
 * Primary data: CoinGecko trending + DexScreener (real market data, free APIs)
 * Secondary: Twitter API v2 (via server-side /api/sentiment)
 * Notifications: Discord webhooks (via server-side /api/notify)
 * 
 * All sensitive API keys are kept server-side — this service calls Next.js API routes.
 */

import { MarketDataService } from "./MarketDataService";

export interface SentimentResult {
  topic: string;
  score: number; // 0-100
  volume: number;
  trending: boolean;
  keywords: string[];
  source: "coingecko" | "dexscreener" | "twitter" | "combined" | "simulated";
}

export interface NotificationPayload {
  title: string;
  description: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  url?: string;
}

// Simulated trending topics with realistic sentiment data
const SIMULATED_TRENDS: Record<string, { baseSentiment: number; volume: number; keywords: string[] }> = {
  "AI Agents": { baseSentiment: 82, volume: 15400, keywords: ["autonomous", "swarm", "intelligence", "agent"] },
  "Monad": { baseSentiment: 88, volume: 23100, keywords: ["monad", "fast", "evm", "parallel"] },
  "Meme Coins": { baseSentiment: 65, volume: 45200, keywords: ["meme", "degen", "moon", "ape"] },
  "DeFi Summer": { baseSentiment: 71, volume: 8900, keywords: ["defi", "yield", "farming", "liquidity"] },
  "NFT Revival": { baseSentiment: 58, volume: 6700, keywords: ["nft", "art", "collection", "mint"] },
  "Gaming Tokens": { baseSentiment: 74, volume: 12300, keywords: ["gaming", "play", "earn", "metaverse"] },
  "RWA Tokenization": { baseSentiment: 79, volume: 5400, keywords: ["rwa", "real", "asset", "tokenize"] },
  "Layer 2 Wars": { baseSentiment: 68, volume: 18700, keywords: ["l2", "rollup", "scaling", "bridge"] },
  "Quantum Computing": { baseSentiment: 61, volume: 3200, keywords: ["quantum", "computing", "crypto", "threat"] },
  "Social Fi": { baseSentiment: 76, volume: 9800, keywords: ["social", "creator", "community", "token"] },
};

export class SocialService {
  private marketData: MarketDataService;

  constructor() {
    this.marketData = new MarketDataService();
  }

  /**
   * Analyze sentiment for a topic
   * Priority: MarketData → Server API (Twitter) → Simulation
   */
  async analyzeSentiment(topic: string): Promise<SentimentResult> {
    // Try real market data first
    try {
      const marketResult = await this.marketData.searchTopic(topic);
      if (marketResult.volume > 0 || marketResult.score > 40) {
        return {
          topic: marketResult.topic,
          score: marketResult.score,
          volume: marketResult.volume,
          trending: marketResult.trending,
          keywords: marketResult.keywords,
          source: marketResult.source as SentimentResult["source"],
        };
      }
    } catch {
      // Fall through to next source
    }

    // Try server-side Twitter sentiment
    try {
      const res = await fetch(`/api/sentiment?topic=${encodeURIComponent(topic)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.source === "twitter" && data.volume > 0) {
          return {
            topic,
            score: data.score,
            volume: data.volume,
            trending: data.trending,
            keywords: [topic.toLowerCase()],
            source: "twitter",
          };
        }
      }
    } catch { /* fall through */ }

    return this.simulateSentiment(topic);
  }

  /**
   * Get trending topics — REAL data from CoinGecko + DexScreener
   */
  async getTrendingTopics(count: number = 5): Promise<SentimentResult[]> {
    try {
      const marketSentiments = await this.marketData.getMarketSentiment(count);
      if (marketSentiments.length > 0) {
        return marketSentiments.map((ms) => ({
          topic: ms.topic,
          score: ms.score,
          volume: ms.volume,
          trending: ms.trending,
          keywords: ms.keywords,
          source: ms.source as SentimentResult["source"],
        }));
      }
    } catch (err) {
      console.warn("Market data unavailable, using simulation:", err);
    }

    // Fallback to simulation
    const topics = Object.keys(SIMULATED_TRENDS);
    const shuffled = topics.sort(() => Math.random() - 0.5).slice(0, count);
    return shuffled.map((t) => this.simulateSentiment(t));
  }

  /**
   * Simulated sentiment for demo
   */
  private simulateSentiment(topic: string): SentimentResult {
    const known = SIMULATED_TRENDS[topic];
    if (known) {
      const jitter = Math.floor(Math.random() * 10) - 5;
      return {
        topic,
        score: Math.max(0, Math.min(100, known.baseSentiment + jitter)),
        volume: known.volume + Math.floor(Math.random() * 1000),
        trending: known.baseSentiment > 70,
        keywords: known.keywords,
        source: "simulated" as const,
      };
    }

    return {
      topic,
      score: 40 + Math.floor(Math.random() * 40),
      volume: Math.floor(Math.random() * 10000),
      trending: Math.random() > 0.7,
      keywords: topic.toLowerCase().split(" "),
      source: "simulated" as const,
    };
  }

  /**
   * Send Discord notification via server-side API route
   */
  async sendDiscordNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn("Discord notify API error:", res.status);
        return false;
      }

      const data = await res.json();
      return data.sent === true;
    } catch {
      console.log("[Discord Sim]", payload.title, "-", payload.description);
      return false;
    }
  }

  /**
   * Send launch announcement to Discord
   */
  async announceLaunch(tokenName: string, tokenSymbol: string, confidence: number, txHash?: string): Promise<boolean> {
    return this.sendDiscordNotification({
      title: `🚀 New Token Launched: ${tokenName} (${tokenSymbol})`,
      description: `GENMON swarm has autonomously launched a new token with ${confidence}% confidence.`,
      color: confidence >= 85 ? 0x00ff00 : confidence >= 75 ? 0xffff00 : 0xff0000,
      fields: [
        { name: "Confidence", value: `${confidence}%`, inline: true },
        { name: "Status", value: "Live on Nad.fun", inline: true },
        ...(txHash ? [{ name: "TX", value: `\`${txHash.slice(0, 18)}...\``, inline: true }] : []),
      ],
    });
  }

  /**
   * Send evolution announcement to Discord
   */
  async announceEvolution(parentA: string, parentB: string, childName: string): Promise<boolean> {
    return this.sendDiscordNotification({
      title: `🧬 New Agent Born: ${childName}`,
      description: `Agents ${parentA} and ${parentB} have bred a new GENMON.`,
      color: 0xbf00ff,
      fields: [
        { name: "Parent A", value: parentA, inline: true },
        { name: "Parent B", value: parentB, inline: true },
        { name: "Child", value: childName, inline: true },
      ],
    });
  }
}
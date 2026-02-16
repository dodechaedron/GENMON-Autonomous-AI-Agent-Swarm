/**
 * MarketDataService — Real market data from CoinGecko & DexScreener
 * 
 * CoinGecko: Trending coins, market cap, price changes (free, no key needed for demo API)
 * DexScreener: Real-time DEX pairs, volume, liquidity, boosted tokens (free, no key needed)
 */

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number | null;
  priceChangePercent24h: number;
  score: number; // trending score 0-100
  thumb: string;
  source: "coingecko";
}

export interface DexPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd: string;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  fdv: number | null;
  pairCreatedAt: number | null;
  url: string;
  source: "dexscreener";
}

export interface MarketSentiment {
  topic: string;
  score: number; // 0-100
  volume: number;
  trending: boolean;
  keywords: string[];
  source: "coingecko" | "dexscreener" | "combined";
  data?: {
    trendingCoins?: TrendingCoin[];
    dexPairs?: DexPair[];
    priceChange?: number;
    marketCap?: number;
  };
}

export interface BoostedToken {
  chainId: string;
  tokenAddress: string;
  name?: string;
  symbol?: string;
  amount: number;
  totalAmount: number;
  url: string;
}

export interface CryptoNewsItem {
  id: string;
  title: string;
  body: string;
  categories: string;
  source: string;
  publishedOn: number;
  url: string;
  tags: string[];
}

export interface TrendingCategory {
  id: string;
  name: string;
  marketCapChange24h: number;
  top3Coins: string[];
  volume24h: number;
}

import { OnChainAnalyzer } from "./OnChainAnalyzer";

// CoinGecko demo API (free, 10-30 calls/min)
const CG_BASE = "https://api.coingecko.com/api/v3";
// DexScreener API (free, 60-300 calls/min)
const DEX_BASE = "https://api.dexscreener.com";
// CryptoCompare API (free, no key for basic endpoints)
const CC_BASE = "https://min-api.cryptocompare.com/data";

// Cache to avoid rate limits
const cache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data as T;
  return null;
}
function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

export class MarketDataService {
  private onChain: OnChainAnalyzer;

  constructor(useMainnet: boolean = false) {
    this.onChain = new OnChainAnalyzer(useMainnet);
  }

  /** Expose on-chain analyzer for direct token analysis */
  getOnChainAnalyzer(): OnChainAnalyzer {
    return this.onChain;
  }

  /**
   * Get trending coins from CoinGecko
   */
  async getTrendingCoins(): Promise<TrendingCoin[]> {
    const cacheKey = "cg_trending";
    const cached = getCached<TrendingCoin[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${CG_BASE}/search/trending`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const data = await res.json();

      const coins: TrendingCoin[] = (data.coins || []).slice(0, 15).map(
        (item: { item: Record<string, unknown> }, idx: number) => {
          const c = item.item;
          return {
            id: c.id as string,
            name: c.name as string,
            symbol: c.symbol as string,
            marketCapRank: (c.market_cap_rank as number) ?? null,
            priceChangePercent24h: (c.data as Record<string, unknown>)?.price_change_percentage_24h
              ? Number(((c.data as Record<string, unknown>).price_change_percentage_24h as Record<string, number>)?.usd ?? 0)
              : 0,
            score: Math.max(10, 100 - idx * 6),
            thumb: (c.thumb as string) || "",
            source: "coingecko" as const,
          };
        }
      );

      setCache(cacheKey, coins, 90_000); // 1.5 min cache
      return coins;
    } catch (err) {
      /* silent: CoinGecko trending may fail due to rate limits */
      return [];
    }
  }

  /**
   * Get top gainers from CoinGecko markets
   */
  async getTopGainers(limit: number = 10): Promise<TrendingCoin[]> {
    const cacheKey = `cg_gainers_${limit}`;
    const cached = getCached<TrendingCoin[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(
        `${CG_BASE}/coins/markets?vs_currency=usd&order=volume_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`,
        { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const data: Record<string, unknown>[] = await res.json();

      const coins: TrendingCoin[] = data.map((c, idx) => ({
        id: c.id as string,
        name: c.name as string,
        symbol: (c.symbol as string).toUpperCase(),
        marketCapRank: (c.market_cap_rank as number) ?? null,
        priceChangePercent24h: (c.price_change_percentage_24h as number) ?? 0,
        score: Math.max(10, 100 - idx * 8),
        thumb: (c.image as string) || "",
        source: "coingecko" as const,
      }));

      setCache(cacheKey, coins, 90_000); // 1.5 min cache
      return coins;
    } catch (err) {
      /* silent: CoinGecko markets may fail due to rate limits */
      return [];
    }
  }

  /**
   * Search DexScreener for pairs matching a query
   */
  async searchDexPairs(query: string): Promise<DexPair[]> {
    const cacheKey = `dex_search_${query}`;
    const cached = getCached<DexPair[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${DEX_BASE}/latest/dex/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`DexScreener ${res.status}`);
      const data = await res.json();

      const pairs: DexPair[] = (data.pairs || []).slice(0, 20).map((p: Record<string, unknown>) => {
        const base = p.baseToken as Record<string, string>;
        const quote = p.quoteToken as Record<string, string>;
        return {
          chainId: p.chainId as string,
          dexId: p.dexId as string,
          pairAddress: p.pairAddress as string,
          baseToken: { address: base.address, name: base.name, symbol: base.symbol },
          quoteToken: { address: quote.address, name: quote.name, symbol: quote.symbol },
          priceUsd: (p.priceUsd as string) || "0",
          priceChange24h: ((p.priceChange as Record<string, number>)?.h24) ?? 0,
          volume24h: ((p.volume as Record<string, number>)?.h24) ?? 0,
          liquidity: ((p.liquidity as Record<string, number>)?.usd) ?? 0,
          fdv: (p.fdv as number) ?? null,
          pairCreatedAt: (p.pairCreatedAt as number) ?? null,
          url: (p.url as string) || "",
          source: "dexscreener" as const,
        };
      });

      setCache(cacheKey, pairs, 60_000); // 1 min cache
      return pairs;
    } catch (err) {
      /* silent: DexScreener search may timeout */
      return [];
    }
  }

  /**
   * Get trending tokens on Nad.fun (Monad) via DexScreener
   * Searches for Monad pairs on nad-fun DEX, sorted by volume
   */
  async getNadFunTrending(): Promise<DexPair[]> {
    const cacheKey = "nadfun_trending";
    const cached = getCached<DexPair[]>(cacheKey);
    if (cached) return cached;

    try {
      // Search multiple terms to find Monad/nad-fun pairs
      const queries = ["MON WMON monad", "nad fun monad"];
      const allPairs: DexPair[] = [];

      for (const q of queries) {
        try {
          const res = await fetch(`${DEX_BASE}/latest/dex/search?q=${encodeURIComponent(q)}`, {
            signal: AbortSignal.timeout(6000),
          });
          if (!res.ok) continue;
          const data = await res.json();
          const pairs = (data.pairs || [])
            .filter((p: Record<string, unknown>) => 
              (p.chainId as string) === "monad" && (p.dexId as string) === "nad-fun"
            )
            .map((p: Record<string, unknown>) => {
              const base = (p.baseToken as Record<string, string>) || {};
              const quote = (p.quoteToken as Record<string, string>) || {};
              return {
                chainId: "monad",
                dexId: "nad-fun",
                pairAddress: (p.pairAddress as string) || "",
                baseToken: { address: base.address || "", name: base.name || "", symbol: base.symbol || "" },
                quoteToken: { address: quote.address || "", name: quote.name || "", symbol: quote.symbol || "" },
                priceUsd: (p.priceUsd as string) || "0",
                priceChange24h: ((p.priceChange as Record<string, number>)?.h24) ?? 0,
                volume24h: ((p.volume as Record<string, number>)?.h24) ?? 0,
                liquidity: ((p.liquidity as Record<string, number>)?.usd) ?? 0,
                fdv: (p.fdv as number) ?? null,
                pairCreatedAt: (p.pairCreatedAt as number) ?? null,
                url: (p.url as string) || "",
                source: "dexscreener" as const,
              };
            });
          allPairs.push(...pairs);
        } catch { /* skip */ }
      }

      // Deduplicate by base token symbol and sort by volume
      const seen = new Set<string>();
      const unique = allPairs
        .sort((a, b) => b.volume24h - a.volume24h)
        .filter((p) => {
          const key = p.baseToken.symbol.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return p.volume24h > 0; // only pairs with volume
        })
        .slice(0, 15);

      setCache(cacheKey, unique, 60_000); // 1 min cache for freshness
      return unique;
    } catch {
      return [];
    }
  }

  /**
   * Get top trending pairs from DexScreener by searching popular terms
   * DexScreener doesn't have a direct "trending" endpoint, so we search for high-volume pairs
   */
  async getDexTrending(): Promise<DexPair[]> {
    const cacheKey = "dex_trending";
    const cached = getCached<DexPair[]>(cacheKey);
    if (cached) return cached;

    try {
      // Search for high-activity pairs across chains
      const queries = ["WETH", "SOL", "MON", "USDC", "PEPE"];
      const allPairs: DexPair[] = [];

      for (const q of queries) {
        try {
          const res = await fetch(`${DEX_BASE}/latest/dex/search?q=${q}`, {
            signal: AbortSignal.timeout(5000),
          });
          if (!res.ok) continue;
          const data = await res.json();
          const pairs = (data.pairs || []).slice(0, 5).map((p: Record<string, unknown>) => {
            const base = (p.baseToken as Record<string, string>) || {};
            const quote = (p.quoteToken as Record<string, string>) || {};
            return {
              chainId: (p.chainId as string) || "",
              dexId: (p.dexId as string) || "",
              pairAddress: (p.pairAddress as string) || "",
              baseToken: { address: base.address || "", name: base.name || "", symbol: base.symbol || "" },
              quoteToken: { address: quote.address || "", name: quote.name || "", symbol: quote.symbol || "" },
              priceUsd: (p.priceUsd as string) || "0",
              priceChange24h: ((p.priceChange as Record<string, number>)?.h24) ?? 0,
              volume24h: ((p.volume as Record<string, number>)?.h24) ?? 0,
              liquidity: ((p.liquidity as Record<string, number>)?.usd) ?? 0,
              fdv: (p.fdv as number) ?? null,
              pairCreatedAt: (p.pairCreatedAt as number) ?? null,
              url: (p.url as string) || "",
              source: "dexscreener" as const,
            };
          });
          allPairs.push(...pairs);
        } catch { /* skip individual query */ }
      }

      // Sort by volume and deduplicate by base token symbol
      const seen = new Set<string>();
      const unique = allPairs
        .sort((a, b) => b.volume24h - a.volume24h)
        .filter((p) => {
          const key = `${p.baseToken.symbol}-${p.chainId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 15);

      setCache(cacheKey, unique, 90_000); // 1.5 min cache
      return unique;
    } catch {
      return [];
    }
  }

  /**
   * Get boosted tokens from DexScreener (tokens with paid promotions = high activity)
   */
  async getBoostedTokens(): Promise<BoostedToken[]> {
    const cacheKey = "dex_boosted";
    const cached = getCached<BoostedToken[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${DEX_BASE}/token-boosts/top/v1`);
      if (!res.ok) throw new Error(`DexScreener ${res.status}`);
      const data: Record<string, unknown>[] = await res.json();

      const tokens: BoostedToken[] = data.slice(0, 20).map((t) => ({
        chainId: t.chainId as string,
        tokenAddress: t.tokenAddress as string,
        name: (t.description as string) || undefined,
        symbol: undefined,
        amount: (t.amount as number) || 0,
        totalAmount: (t.totalAmount as number) || 0,
        url: (t.url as string) || `https://dexscreener.com/${t.chainId}/${t.tokenAddress}`,
      }));

      setCache(cacheKey, tokens, 120_000);
      return tokens;
    } catch (err) {
      /* silent: DexScreener boosted may timeout */
      return [];
    }
  }

  /**
   * Get latest token profiles from DexScreener
   */
  async getLatestTokenProfiles(): Promise<DexPair[]> {
    const cacheKey = "dex_profiles";
    const cached = getCached<DexPair[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${DEX_BASE}/token-profiles/latest/v1`);
      if (!res.ok) throw new Error(`DexScreener ${res.status}`);
      const data: Record<string, unknown>[] = await res.json();

      // Token profiles don't have pair data, so we search for each
      const tokens = data.slice(0, 10);
      const pairs: DexPair[] = [];

      for (const t of tokens.slice(0, 5)) {
        const chainId = t.chainId as string;
        const addr = t.tokenAddress as string;
        try {
          const pairRes = await fetch(`${DEX_BASE}/token-pairs/v1/${chainId}/${addr}`);
          if (pairRes.ok) {
            const pairData = await pairRes.json();
            const topPairs = (pairData.pairs || pairData || []).slice(0, 1);
            for (const p of topPairs) {
              const base = p.baseToken || {};
              const quote = p.quoteToken || {};
              pairs.push({
                chainId: p.chainId || chainId,
                dexId: p.dexId || "",
                pairAddress: p.pairAddress || "",
                baseToken: { address: base.address || addr, name: base.name || "", symbol: base.symbol || "" },
                quoteToken: { address: quote.address || "", name: quote.name || "", symbol: quote.symbol || "" },
                priceUsd: p.priceUsd || "0",
                priceChange24h: p.priceChange?.h24 ?? 0,
                volume24h: p.volume?.h24 ?? 0,
                liquidity: p.liquidity?.usd ?? 0,
                fdv: p.fdv ?? null,
                pairCreatedAt: p.pairCreatedAt ?? null,
                url: p.url || "",
                source: "dexscreener" as const,
              });
            }
          }
        } catch { /* skip */ }
      }

      setCache(cacheKey, pairs, 120_000);
      return pairs;
    } catch (err) {
      /* silent: DexScreener profiles may timeout */
      return [];
    }
  }

  /**
   * Get crypto news from CryptoCompare (free, no API key needed)
   */
  async getCryptoNews(limit: number = 20): Promise<CryptoNewsItem[]> {
    const cacheKey = `cc_news_${limit}`;
    const cached = getCached<CryptoNewsItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(
        `${CC_BASE}/v2/news/?lang=EN&sortOrder=popular&limit=${limit}`,
        { headers: { accept: "application/json" } }
      );
      if (!res.ok) throw new Error(`CryptoCompare ${res.status}`);
      const data = await res.json();

      const items: CryptoNewsItem[] = (data.Data || []).map((n: Record<string, unknown>) => ({
        id: String(n.id),
        title: (n.title as string) || "",
        body: ((n.body as string) || "").slice(0, 300),
        categories: (n.categories as string) || "",
        source: (n.source_info as Record<string, string>)?.name || (n.source as string) || "",
        publishedOn: (n.published_on as number) || 0,
        url: (n.url as string) || "",
        tags: ((n.tags as string) || "").split("|").filter(Boolean),
      }));

      setCache(cacheKey, items, 180_000); // 3 min cache
      return items;
    } catch (err) {
      /* silent: CryptoCompare news may fail */
      return [];
    }
  }

  /**
   * Get trending categories from CoinGecko (free)
   */
  async getTrendingCategories(limit: number = 10): Promise<TrendingCategory[]> {
    const cacheKey = `cg_categories_${limit}`;
    const cached = getCached<TrendingCategory[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${CG_BASE}/coins/categories?order=market_cap_change_24h_desc`, {
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(`CoinGecko categories ${res.status}`);
      const data: Record<string, unknown>[] = await res.json();

      const categories: TrendingCategory[] = data.slice(0, limit).map((c) => ({
        id: (c.id as string) || "",
        name: (c.name as string) || "",
        marketCapChange24h: (c.market_cap_change_24h as number) ?? 0,
        top3Coins: ((c.top_3_coins as string[]) || []).slice(0, 3),
        volume24h: (c.volume_24h as number) ?? 0,
      }));

      setCache(cacheKey, categories, 180_000);
      return categories;
    } catch (err) {
      /* silent: CoinGecko categories may fail due to rate limits */
      return [];
    }
  }

  /**
   * Get new DEX pairs for a specific chain (early signal detection)
   */
  async getNewDexPairs(chainId: string = "monad"): Promise<DexPair[]> {
    const cacheKey = `dex_new_${chainId}`;
    const cached = getCached<DexPair[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${DEX_BASE}/latest/dex/pairs/${chainId}`);
      if (!res.ok) throw new Error(`DexScreener new pairs ${res.status}`);
      const data = await res.json();

      const pairs: DexPair[] = (data.pairs || []).slice(0, 20).map((p: Record<string, unknown>) => {
        const base = (p.baseToken as Record<string, string>) || {};
        const quote = (p.quoteToken as Record<string, string>) || {};
        return {
          chainId: (p.chainId as string) || chainId,
          dexId: (p.dexId as string) || "",
          pairAddress: (p.pairAddress as string) || "",
          baseToken: { address: base.address || "", name: base.name || "", symbol: base.symbol || "" },
          quoteToken: { address: quote.address || "", name: quote.name || "", symbol: quote.symbol || "" },
          priceUsd: (p.priceUsd as string) || "0",
          priceChange24h: ((p.priceChange as Record<string, number>)?.h24) ?? 0,
          volume24h: ((p.volume as Record<string, number>)?.h24) ?? 0,
          liquidity: ((p.liquidity as Record<string, number>)?.usd) ?? 0,
          fdv: (p.fdv as number) ?? null,
          pairCreatedAt: (p.pairCreatedAt as number) ?? null,
          url: (p.url as string) || "",
          source: "dexscreener" as const,
        };
      });

      pairs.sort((a, b) => (b.pairCreatedAt ?? 0) - (a.pairCreatedAt ?? 0));
      setCache(cacheKey, pairs, 90_000); // 1.5 min cache
      return pairs;
    } catch (err) {
      /* silent: DexScreener new pairs may timeout */
      return [];
    }
  }

  /**
   * Extract trending keywords from news headlines
   */
  extractNewsKeywords(news: CryptoNewsItem[]): { keyword: string; count: number; sentiment: number }[] {
    const stopWords = new Set(["this", "that", "with", "from", "have", "been", "will", "what", "when", "your", "more", "about", "than", "them", "into", "could", "would", "their", "after", "before", "other", "which", "there", "these", "those", "just", "also", "over", "such", "some", "very", "most", "only"]);
    const keywordMap = new Map<string, { count: number; recency: number }>();
    const now = Date.now() / 1000;

    for (const item of news) {
      const words = `${item.title} ${item.categories}`.toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w));

      const allTerms = [...new Set([...words, ...item.tags.map((t) => t.toLowerCase())])];
      const recencyBonus = Math.max(0, 1 - (now - item.publishedOn) / 86400);

      for (const term of allTerms) {
        const existing = keywordMap.get(term) || { count: 0, recency: 0 };
        existing.count++;
        existing.recency = Math.max(existing.recency, recencyBonus);
        keywordMap.set(term, existing);
      }
    }

    return Array.from(keywordMap.entries())
      .filter(([, v]) => v.count >= 2)
      .map(([keyword, v]) => ({
        keyword,
        count: v.count,
        sentiment: Math.min(100, 40 + v.count * 10 + v.recency * 20),
      }))
      .sort((a, b) => b.count - a.count || b.sentiment - a.sentiment)
      .slice(0, 15);
  }

  /**
   * Combined market sentiment — merges ALL sources:
   * CoinGecko trending + DexScreener boosted + CryptoCompare news + CoinGecko categories + new DEX pairs
   */
  async getMarketSentiment(count: number = 5): Promise<MarketSentiment[]> {
    const [nadFunTokens, trending, boosted, gainers, news, categories, newPairs, dexTrending, onChainSentiment] = await Promise.all([
      this.getNadFunTrending().catch(() => []),
      this.getTrendingCoins().catch(() => []),
      this.getBoostedTokens().catch(() => []),
      this.getTopGainers(15).catch(() => []),
      this.getCryptoNews(20).catch(() => []),
      this.getTrendingCategories(8).catch(() => []),
      this.getNewDexPairs("monad").catch(() => []),
      this.getDexTrending().catch(() => []),
      this.onChain.getOnChainSentiment().catch(() => null),
    ]);

    const sentiments: MarketSentiment[] = [];
    const seenTopics = new Set<string>();

    // Distribute slots — Nad.fun gets priority
    const nadFunSlots = Math.max(4, Math.ceil(count * 0.35));
    const trendingSlots = Math.max(2, Math.ceil(count * 0.2));
    const gainerSlots = Math.max(1, Math.ceil(count * 0.1));
    const dexSlots = Math.max(1, Math.ceil(count * 0.1));

    // 0. From Nad.fun trending (PRIORITY — Monad native)
    for (const pair of nadFunTokens.slice(0, nadFunSlots)) {
      const sym = pair.baseToken.symbol.toLowerCase();
      if (!sym || sym === "mon" || sym === "wmon" || seenTopics.has(sym)) continue;
      seenTopics.add(sym);
      const volScore = pair.volume24h > 100_000 ? 35 : pair.volume24h > 10_000 ? 25 : pair.volume24h > 1_000 ? 15 : 5;
      const changeScore = Math.min(25, Math.max(-15, pair.priceChange24h / 2));
      // Nad.fun tokens get a base boost since they're native to our platform
      const nadBoost = 15;
      const score = Math.max(20, Math.min(100, 45 + volScore + changeScore + nadBoost));
      sentiments.push({
        topic: `${pair.baseToken.name || pair.baseToken.symbol} (${pair.baseToken.symbol})`,
        score: Math.round(score),
        volume: Math.round(pair.volume24h),
        trending: pair.volume24h > 1_000,
        keywords: [sym, "nad-fun", "monad", "bonding-curve"],
        source: "dexscreener",
        data: { dexPairs: [pair], priceChange: pair.priceChange24h },
      });
    }

    // 1. From CoinGecko trending
    for (const coin of trending.slice(0, trendingSlots)) {
      const priceChange = coin.priceChangePercent24h;
      const momentumBonus = priceChange > 0 ? Math.min(20, priceChange) : Math.max(-20, priceChange / 2);
      const score = Math.max(10, Math.min(100, Math.round(coin.score + momentumBonus)));
      const key = coin.symbol.toLowerCase();
      if (seenTopics.has(key)) continue;
      seenTopics.add(key);

      sentiments.push({
        topic: `${coin.name} (${coin.symbol})`,
        score,
        volume: coin.marketCapRank ? 100000 / coin.marketCapRank : 5000,
        trending: coin.score > 60,
        keywords: [coin.symbol.toLowerCase(), coin.name.toLowerCase(), "trending", "coingecko"],
        source: "coingecko",
        data: {
          trendingCoins: [coin],
          priceChange,
          marketCap: coin.marketCapRank ? 1000000000 / coin.marketCapRank : undefined,
        },
      });
    }

    // 2. From top gainers — always include for variety
    for (const coin of gainers.slice(0, gainerSlots)) {
      const key = coin.symbol.toLowerCase();
      if (seenTopics.has(key)) continue;
      seenTopics.add(key);
      const score = Math.max(10, Math.min(100, 50 + coin.priceChangePercent24h));
      sentiments.push({
        topic: `${coin.name} (${coin.symbol})`,
        score: Math.round(score),
        volume: 10000,
        trending: coin.priceChangePercent24h > 5,
        keywords: [coin.symbol.toLowerCase(), "gainer", "volume", "coingecko"],
        source: "coingecko",
        data: { priceChange: coin.priceChangePercent24h },
      });
    }

    // 3. From DexScreener trending (top volume pairs)
    for (const pair of dexTrending.slice(0, dexSlots)) {
      const sym = pair.baseToken.symbol.toLowerCase();
      if (!sym || seenTopics.has(sym)) continue;
      seenTopics.add(sym);
      const volScore = pair.volume24h > 1_000_000 ? 30 : pair.volume24h > 100_000 ? 20 : 10;
      const changeScore = Math.min(20, Math.max(-10, pair.priceChange24h));
      const score = Math.max(10, Math.min(100, 40 + volScore + changeScore));
      sentiments.push({
        topic: `${pair.baseToken.name || pair.baseToken.symbol} (${pair.baseToken.symbol})`,
        score: Math.round(score),
        volume: Math.round(pair.volume24h),
        trending: pair.volume24h > 500_000,
        keywords: [sym, pair.chainId, pair.dexId, "dexscreener", "volume"],
        source: "dexscreener",
        data: { dexPairs: [pair], priceChange: pair.priceChange24h },
      });
    }

    // 4. From CryptoCompare news — extract hot narratives
    if (news.length > 0) {
      const newsKeywords = this.extractNewsKeywords(news);
      for (const kw of newsKeywords.slice(0, 3)) {
        if (seenTopics.has(kw.keyword)) continue;
        seenTopics.add(kw.keyword);
        sentiments.push({
          topic: `${kw.keyword.charAt(0).toUpperCase() + kw.keyword.slice(1)} (News)`,
          score: kw.sentiment,
          volume: kw.count * 5000,
          trending: kw.count >= 3,
          keywords: [kw.keyword, "news", "cryptocompare", "narrative"],
          source: "combined",
        });
      }
    }

    // 5. From CoinGecko categories — sector momentum
    for (const cat of categories.slice(0, 2)) {
      const catKey = cat.name.toLowerCase();
      if (seenTopics.has(catKey)) continue;
      seenTopics.add(catKey);
      const change = cat.marketCapChange24h;
      const score = Math.max(10, Math.min(100, 50 + change * 2));
      sentiments.push({
        topic: `${cat.name} Sector`,
        score: Math.round(score),
        volume: cat.volume24h > 0 ? Math.round(cat.volume24h / 1_000_000) : 5000,
        trending: change > 3,
        keywords: [catKey, "category", "sector", "coingecko"],
        source: "coingecko",
        data: { priceChange: change },
      });
    }

    // 6. From DexScreener boosted tokens
    for (const token of boosted.slice(0, 2)) {
      const score = Math.min(100, 50 + token.totalAmount * 2);
      sentiments.push({
        topic: token.name || `Boosted ${token.chainId} Token`,
        score,
        volume: token.totalAmount * 100,
        trending: token.totalAmount > 10,
        keywords: [token.chainId, "boosted", "dexscreener", "promoted"],
        source: "dexscreener",
        data: {},
      });
    }

    // 7. From new Monad DEX pairs (early signals)
    for (const pair of newPairs.slice(0, 2)) {
      const sym = pair.baseToken.symbol.toLowerCase();
      if (!sym || seenTopics.has(sym)) continue;
      seenTopics.add(sym);
      const age = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 3600_000 : 999;
      const freshnessBonus = age < 1 ? 30 : age < 6 ? 20 : age < 24 ? 10 : 0;
      const score = Math.max(10, Math.min(100, 40 + freshnessBonus + Math.min(20, pair.priceChange24h)));
      sentiments.push({
        topic: `${pair.baseToken.name || pair.baseToken.symbol} (New Pair)`,
        score: Math.round(score),
        volume: Math.round(pair.volume24h),
        trending: age < 6 && pair.volume24h > 1000,
        keywords: [sym, "new-pair", "monad", "dexscreener", "early"],
        source: "dexscreener",
        data: { dexPairs: [pair], priceChange: pair.priceChange24h },
      });
    }

    // 8. From Monad on-chain activity (RPC direct)
    if (onChainSentiment && onChainSentiment.score > 20) {
      sentiments.push({
        topic: onChainSentiment.topic,
        score: onChainSentiment.score,
        volume: onChainSentiment.volume,
        trending: onChainSentiment.trending,
        keywords: onChainSentiment.keywords,
        source: "combined",
      });
    }

    return sentiments.sort((a, b) => b.score - a.score).slice(0, count);
  }

  /**
   * Search for a specific topic across both APIs
   */
  async searchTopic(topic: string): Promise<MarketSentiment> {
    const [dexPairs] = await Promise.all([
      this.searchDexPairs(topic),
    ]);

    if (dexPairs.length > 0) {
      const topPair = dexPairs[0];
      const avgVolume = dexPairs.reduce((sum, p) => sum + p.volume24h, 0) / dexPairs.length;
      const avgChange = dexPairs.reduce((sum, p) => sum + p.priceChange24h, 0) / dexPairs.length;
      const score = Math.max(10, Math.min(100, 50 + avgChange + Math.log10(avgVolume + 1) * 5));

      return {
        topic,
        score: Math.round(score),
        volume: Math.round(avgVolume),
        trending: avgChange > 5 && avgVolume > 10000,
        keywords: [topPair.baseToken.symbol.toLowerCase(), topPair.dexId, topPair.chainId],
        source: "dexscreener",
        data: { dexPairs: dexPairs.slice(0, 5) },
      };
    }

    // Fallback — no data found
    return {
      topic,
      score: 30 + Math.floor(Math.random() * 20),
      volume: 0,
      trending: false,
      keywords: topic.toLowerCase().split(" "),
      source: "combined",
    };
  }
}

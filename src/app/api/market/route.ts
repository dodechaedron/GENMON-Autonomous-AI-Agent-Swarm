/**
 * /api/market — Server-side proxy for all market data
 * 
 * Endpoints (via ?action= query param):
 *   sentiment   — Combined market sentiment from all sources
 *   trending    — CoinGecko trending coins
 *   gainers     — Top gainers by volume
 *   news        — CryptoCompare crypto news
 *   categories  — CoinGecko trending categories
 *   boosted     — DexScreener boosted tokens
 *   pairs       — DexScreener new pairs for a chain
 *   search      — Search DexScreener pairs
 *   onchain     — Monad on-chain network activity
 *   token       — Analyze specific token on-chain
 */

import { NextRequest, NextResponse } from "next/server";
import { MarketDataService } from "@/services/MarketDataService";

const marketData = new MarketDataService();

// Simple rate limiter: max 60 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const action = req.nextUrl.searchParams.get("action") || "sentiment";
  const count = parseInt(req.nextUrl.searchParams.get("count") || "8", 10);

  try {
    switch (action) {
      case "sentiment": {
        const data = await marketData.getMarketSentiment(Math.min(count, 15)).catch(() => []);
        return NextResponse.json({ data, source: "server", timestamp: Date.now() });
      }
      case "trending": {
        const data = await marketData.getTrendingCoins().catch(() => []);
        return NextResponse.json({ data, source: "server", timestamp: Date.now() });
      }
      case "gainers": {
        const data = await marketData.getTopGainers(Math.min(count, 20)).catch(() => []);
        return NextResponse.json({ data, source: "server", timestamp: Date.now() });
      }
      case "news": {
        const data = await marketData.getCryptoNews(Math.min(count, 30)).catch(() => []);
        return NextResponse.json({ data, source: "server", timestamp: Date.now() });
      }
      case "categories": {
        const data = await marketData.getTrendingCategories(Math.min(count, 15)).catch(() => []);
        return NextResponse.json({ data, source: "server", timestamp: Date.now() });
      }
      case "boosted": {
        const data = await marketData.getBoostedTokens().catch(() => []);
        return NextResponse.json({ data, source: "server", timestamp: Date.now() });
      }
      case "dextrending": {
        const data = await marketData.getDexTrending().catch(() => []);
        return NextResponse.json({ data, source: "server", timestamp: Date.now() });
      }
      case "pairs": {
        const chainId = req.nextUrl.searchParams.get("chainId") || "monad";
        const data = await marketData.getNewDexPairs(chainId).catch(() => []);
        return NextResponse.json({ data, source: "server" });
      }
      case "search": {
        const q = req.nextUrl.searchParams.get("q") || "";
        if (!q) return NextResponse.json({ data: [], source: "server" });
        const data = await marketData.searchDexPairs(q).catch(() => []);
        return NextResponse.json({ data, source: "server" });
      }
      case "onchain": {
        const analyzer = marketData.getOnChainAnalyzer();
        const data = await analyzer.getNetworkActivity(5).catch(() => null);
        return NextResponse.json({ data, source: "server" });
      }
      case "token": {
        const address = req.nextUrl.searchParams.get("address") || "";
        if (!address) return NextResponse.json({ data: null, source: "server" });
        const analyzer = marketData.getOnChainAnalyzer();
        const data = await analyzer.analyzeToken(address).catch(() => null);
        return NextResponse.json({ data, source: "server" });
      }
      default:
        return NextResponse.json({ data: null, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error("Market API error:", err);
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : "Internal error", source: "server" },
      { status: 200 } // Return 200 with empty data instead of 500
    );
  }
}

"use client";

import { useCallback, useEffect, useState } from "react";

/* ── Types ── */
interface TrendingItem {
  topic: string;
  score: number;
  volume: number;
  trending: boolean;
  keywords: string[];
  source: string;
  data?: { priceChange?: number };
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedOn: number;
  url: string;
  tags: string[];
}

interface OnChainData {
  blockNumber: number;
  txCount: number;
  gasUtilization: number;
  avgGasPrice: string;
  blocksAnalyzed: number;
}

/* ── Helpers ── */
function scoreColor(score: number) {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 75) return "bg-green-400/10 border-green-400/20";
  if (score >= 50) return "bg-yellow-400/10 border-yellow-400/20";
  return "bg-red-400/10 border-red-400/20";
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

/* ── Component ── */
export default function MarketDashboard() {
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [onChain, setOnChain] = useState<OnChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [tab, setTab] = useState<"trending" | "news" | "onchain">("trending");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sentRes, newsRes, chainRes] = await Promise.allSettled([
        fetch("/api/market?action=sentiment&count=12"),
        fetch("/api/market?action=news&count=10"),
        fetch("/api/market?action=onchain"),
      ]);

      if (sentRes.status === "fulfilled" && sentRes.value.ok) {
        const d = await sentRes.value.json();
        setTrending(d.data || []);
      }
      if (newsRes.status === "fulfilled" && newsRes.value.ok) {
        const d = await newsRes.value.json();
        setNews(d.data || []);
      }
      if (chainRes.status === "fulfilled" && chainRes.value.ok) {
        const d = await chainRes.value.json();
        setOnChain(d.data || null);
      }
      setLastUpdate(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60_000); // refresh every 1 min
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <div className="rounded-xl border border-white/5 bg-space/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <span className="text-xs font-semibold text-white/80">Market Intel</span>
          {loading ? (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" title="Live" />
          )}
          <span className="text-[8px] text-gray-600">LIVE</span>
        </div>
        <div className="flex items-center gap-1.5">
          {lastUpdate && (
            <span className="text-[9px] text-gray-600">
              {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="text-[10px] text-gray-500 hover:text-cyan transition-colors disabled:opacity-30"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {(["trending", "news", "onchain"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-[10px] font-medium transition-all ${
              tab === t
                ? "text-cyan border-b border-cyan bg-cyan/5"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t === "trending" ? "🔥 Trending" : t === "news" ? "📰 News" : "⛓ On-Chain"}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 text-[10px] text-red-400 bg-red-400/5">{error}</div>
      )}

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
        {tab === "trending" && <TrendingTab items={trending} loading={loading} />}
        {tab === "news" && <NewsTab items={news} loading={loading} />}
        {tab === "onchain" && <OnChainTab data={onChain} loading={loading} />}
      </div>
    </div>
  );
}

/* ── Trending Tab ── */
function TrendingTab({ items, loading }: { items: TrendingItem[]; loading: boolean }) {
  if (loading && items.length === 0) return <Skeleton rows={5} />;
  if (items.length === 0) return <Empty msg="No trending data" />;

  return (
    <div className="divide-y divide-white/5">
      {items.map((item, i) => (
        <div key={i} className="px-3 py-2 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {item.trending && <span className="text-[10px]">🔥</span>}
              <span className="text-xs text-white/90 truncate font-medium">{item.topic}</span>
            </div>
            <span className={`text-xs font-mono font-bold ${scoreColor(item.score)}`}>
              {item.score}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className={`px-1.5 py-0.5 rounded border ${scoreBg(item.score)}`}>
              {item.score >= 75 ? "Bullish" : item.score >= 50 ? "Neutral" : "Bearish"}
            </span>
            {item.volume > 0 && <span>Vol: {formatVolume(item.volume)}</span>}
            {item.data?.priceChange !== undefined && (
              <span className={item.data.priceChange >= 0 ? "text-green-400" : "text-red-400"}>
                {item.data.priceChange >= 0 ? "+" : ""}{item.data.priceChange.toFixed(1)}%
              </span>
            )}
            <span className={`ml-auto px-1 py-0.5 rounded text-[9px] ${
              item.keywords.includes("nad-fun") ? "bg-purple-500/10 text-purple-400" :
              item.source === "coingecko" ? "bg-yellow-500/10 text-yellow-400" :
              item.source === "dexscreener" ? "bg-green-500/10 text-green-400" :
              "bg-blue-500/10 text-blue-400"
            }`}>
              {item.keywords.includes("nad-fun") ? "NAD" : item.source === "coingecko" ? "CG" : item.source === "dexscreener" ? "DEX" : "MIX"}
            </span>
          </div>
          {item.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.keywords.slice(0, 4).map((kw) => (
                <span key={kw} className="text-[9px] px-1 py-0.5 rounded bg-white/5 text-gray-500">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── News Tab ── */
function NewsTab({ items, loading }: { items: NewsItem[]; loading: boolean }) {
  if (loading && items.length === 0) return <Skeleton rows={5} />;
  if (items.length === 0) return <Empty msg="No news available" />;

  return (
    <div className="divide-y divide-white/5">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-3 py-2 hover:bg-white/[0.02] transition-colors group"
        >
          <p className="text-xs text-white/80 leading-snug group-hover:text-cyan transition-colors line-clamp-2">
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
            <span className="text-gray-400">{item.source}</span>
            <span>·</span>
            <span>{timeAgo(item.publishedOn)}</span>
            {item.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1 py-0.5 rounded bg-white/5 text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  );
}

/* ── On-Chain Tab ── */
function OnChainTab({ data, loading }: { data: OnChainData | null; loading: boolean }) {
  if (loading && !data) return <Skeleton rows={4} />;
  if (!data) return <Empty msg="On-chain data unavailable" />;

  const txPerBlock = data.txCount > 0 ? (data.txCount / data.blocksAnalyzed).toFixed(0) : "0";
  const gasGwei = (parseFloat(data.avgGasPrice) / 1e9).toFixed(2);
  const gasUtil = data.gasUtilization.toFixed(1);

  const metrics = [
    { label: "Block Height", value: data.blockNumber.toLocaleString(), icon: "🧱" },
    { label: "Total TX (last blocks)", value: data.txCount.toLocaleString(), icon: "📦" },
    { label: "TX / Block", value: txPerBlock, icon: "⚡" },
    { label: "Gas Utilization", value: `${gasUtil}%`, icon: "⛽" },
    { label: "Avg Gas Price", value: `${gasGwei} Gwei`, icon: "💰" },
    { label: "Blocks Analyzed", value: String(data.blocksAnalyzed), icon: "🔍" },
  ];

  // Activity level indicator
  const txNum = parseInt(txPerBlock);
  const activityLevel = txNum > 50 ? "High" : txNum > 10 ? "Medium" : "Low";
  const activityColor = txNum > 50 ? "text-green-400" : txNum > 10 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="p-3 space-y-3">
      {/* Activity banner */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
        txNum > 50 ? "bg-green-400/5 border-green-400/20" : txNum > 10 ? "bg-yellow-400/5 border-yellow-400/20" : "bg-red-400/5 border-red-400/20"
      }`}>
        <span className="text-[10px] text-gray-400">Monad Network Activity</span>
        <span className={`text-xs font-bold ${activityColor}`}>{activityLevel}</span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg bg-white/[0.02] border border-white/5 px-2.5 py-2">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px]">{m.icon}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">{m.label}</span>
            </div>
            <span className="text-sm font-mono font-bold text-white/90">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Shared ── */
function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="p-3 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 rounded bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="p-6 text-center text-xs text-gray-600">{msg}</div>
  );
}
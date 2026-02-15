/**
 * /api/sentiment — Server-side Twitter sentiment analysis
 * 
 * Keeps Twitter Bearer Token on server only (no NEXT_PUBLIC_).
 * Falls back to market data if Twitter unavailable.
 */

import { NextRequest, NextResponse } from "next/server";

const TWITTER_BEARER = process.env.TWITTER_BEARER || "";

export async function GET(req: NextRequest) {
  const topic = req.nextUrl.searchParams.get("topic") || "";
  if (!topic) {
    return NextResponse.json({ error: "Missing topic param" }, { status: 400 });
  }

  // Try Twitter first
  if (TWITTER_BEARER) {
    try {
      const query = encodeURIComponent(`${topic} crypto -is:retweet lang:en`);
      const res = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=100&tweet.fields=public_metrics,created_at`,
        { headers: { Authorization: `Bearer ${TWITTER_BEARER}` } }
      );

      if (res.ok) {
        const data = await res.json();
        const tweets = data.data || [];
        let positiveSignals = 0;
        let totalSignals = 0;

        for (const tweet of tweets) {
          const m = tweet.public_metrics || {};
          const engagement = (m.like_count || 0) + (m.retweet_count || 0);
          positiveSignals += engagement;
          totalSignals += engagement + (m.reply_count || 0);
        }

        const score = totalSignals > 0
          ? Math.min(100, Math.round((positiveSignals / totalSignals) * 100))
          : 50;

        return NextResponse.json({
          topic,
          score,
          volume: tweets.length,
          trending: tweets.length > 50 && score > 70,
          source: "twitter",
        });
      }
    } catch {
      // Fall through
    }
  }

  // No Twitter — return empty so client can use market data
  return NextResponse.json({
    topic,
    score: 0,
    volume: 0,
    trending: false,
    source: "unavailable",
  });
}

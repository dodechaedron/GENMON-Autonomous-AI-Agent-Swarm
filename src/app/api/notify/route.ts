/**
 * /api/notify — Server-side notification hub (Telegram + Discord)
 * 
 * Keeps all tokens/webhooks server-side only.
 * Client sends notification payload, server forwards to configured channels.
 */

import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

// Urgency → Discord embed color
const URGENCY_COLORS: Record<string, number> = {
  high: 0xff0044,
  medium: 0x00ffff,
  low: 0x666666,
};

// Urgency → Telegram emoji prefix
const URGENCY_PREFIX: Record<string, string> = {
  high: "🔴 ",
  medium: "",
  low: "",
};

async function sendDiscord(payload: {
  title: string; message: string; fields?: { name: string; value: string }[]; urgency?: string;
}): Promise<boolean> {
  if (!DISCORD_WEBHOOK) return false;
  try {
    const embed = {
      title: payload.title,
      description: payload.message,
      color: URGENCY_COLORS[payload.urgency || "medium"] || 0x00ffff,
      fields: (payload.fields || []).map((f) => ({ name: f.name, value: f.value, inline: true })),
      timestamp: new Date().toISOString(),
      footer: { text: "GENMON Swarm 🧬" },
    };
    const res = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "GENMON", embeds: [embed] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendTelegram(payload: {
  title: string; message: string; fields?: { name: string; value: string }[]; urgency?: string;
}): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  try {
    const prefix = URGENCY_PREFIX[payload.urgency || "medium"] || "";
    let text = `${prefix}<b>${escapeHtml(payload.title)}</b>\n\n${escapeHtml(payload.message)}`;
    if (payload.fields && payload.fields.length > 0) {
      text += "\n";
      for (const f of payload.fields) {
        text += `\n<b>${escapeHtml(f.name)}:</b> ${escapeHtml(f.value)}`;
      }
    }
    text += "\n\n<i>— GENMON Swarm 🧬</i>";

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, fields, urgency, channel } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Missing title or message" }, { status: 400 });
    }

    const payload = { title, message, fields, urgency };
    const ch = channel || "all";

    const [telegram, discord] = await Promise.all([
      (ch === "all" || ch === "telegram") ? sendTelegram(payload) : Promise.resolve(false),
      (ch === "all" || ch === "discord") ? sendDiscord(payload) : Promise.resolve(false),
    ]);

    return NextResponse.json({ telegram, discord });
  } catch (err) {
    return NextResponse.json(
      { telegram: false, discord: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 200 }
    );
  }
}

// GET endpoint to check notification config status
export async function GET() {
  return NextResponse.json({
    discord: !!DISCORD_WEBHOOK,
    telegram: !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
  });
}

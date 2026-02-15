/**
 * Test Telegram bot notification
 * Run: node scripts/test-telegram.js
 */
require("dotenv").config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env");
  process.exit(1);
}

async function test() {
  console.log("Bot Token:", TOKEN.slice(0, 10) + "...");
  console.log("Chat ID:", CHAT_ID);

  // First, check bot info
  const botInfo = await fetch(`https://api.telegram.org/bot${TOKEN}/getMe`);
  const botData = await botInfo.json();
  if (botData.ok) {
    console.log("✓ Bot connected:", botData.result.first_name, `(@${botData.result.username})`);
  } else {
    console.error("✗ Bot token invalid:", botData.description);
    return;
  }

  // Try sending test message
  console.log("\nSending test message...");
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: "🧬 <b>GENMON Alert Bot — Online!</b>\n\n✅ Bot successfully connected.\n\nYou will receive real-time alerts for:\n🚀 Token launches\n💎 High-score opportunities\n🧬 Agent evolution &amp; breeding\n📈 Performance tracking\n\n<i>— GENMON Swarm Intelligence on Monad</i>",
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const data = await res.json();
  if (data.ok) {
    console.log("✓ Message sent successfully!");
    console.log("  Chat type:", data.result.chat.type);
    console.log("  Chat title:", data.result.chat.title || data.result.chat.first_name || "DM");
  } else {
    console.error("✗ Failed to send:", data.description);
    
    if (data.description?.includes("chat not found")) {
      console.log("\nTip: For channels, the chat ID should be the channel username (e.g. @genmon_alerts)");
      console.log("Or a negative number like -1001234567890");
      console.log("\nTrying to get updates to find the correct chat ID...");
      
      const updates = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates`);
      const updData = await updates.json();
      if (updData.ok && updData.result.length > 0) {
        console.log("\nRecent chats:");
        const seen = new Set();
        for (const u of updData.result) {
          const chat = u.message?.chat || u.channel_post?.chat || u.my_chat_member?.chat;
          if (chat && !seen.has(chat.id)) {
            seen.add(chat.id);
            console.log(`  ID: ${chat.id} | Type: ${chat.type} | Title: ${chat.title || chat.first_name || "?"}`);
          }
        }
      } else {
        console.log("No recent updates. Send a message in the channel first, then run this again.");
      }
    }
  }
}

test().catch(console.error);

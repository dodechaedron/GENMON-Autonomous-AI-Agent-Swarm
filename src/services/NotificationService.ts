/**
 * Unified Notification Service — Telegram + Discord
 * 
 * Sends notifications via server-side /api/notify route.
 * Supports: launch alerts, opportunity alerts, evolution alerts, performance alerts.
 */

export type NotifyChannel = "telegram" | "discord" | "all";

export interface NotifyEvent {
  type: "launch" | "opportunity" | "evolution" | "performance" | "death" | "custom";
  title: string;
  message: string;
  fields?: { name: string; value: string }[];
  urgency?: "low" | "medium" | "high";
}

export const NotificationService = {
  async send(event: NotifyEvent, channel: NotifyChannel = "all"): Promise<{ telegram: boolean; discord: boolean }> {
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...event, channel }),
      });
      if (!res.ok) return { telegram: false, discord: false };
      return await res.json();
    } catch {
      return { telegram: false, discord: false };
    }
  },

  // === Preset notifications ===

  async launchAlert(tokenName: string, tokenSymbol: string, confidence: number, mode: string, txHash?: string) {
    const emoji = confidence >= 85 ? "🟢" : confidence >= 70 ? "🟡" : "🔴";
    return this.send({
      type: "launch",
      title: `🚀 Token Launched: ${tokenName} (${tokenSymbol})`,
      message: `${emoji} Confidence: ${confidence}%\nMode: ${mode}${txHash ? `\nTX: ${txHash.slice(0, 20)}...` : ""}`,
      fields: [
        { name: "Token", value: `${tokenName} (${tokenSymbol})` },
        { name: "Confidence", value: `${confidence}%` },
        { name: "Mode", value: mode },
      ],
      urgency: confidence >= 85 ? "high" : "medium",
    });
  },

  async opportunityAlert(topic: string, score: number, source: string) {
    if (score < 75) return { telegram: false, discord: false }; // Only alert high-score opportunities
    return this.send({
      type: "opportunity",
      title: `💎 High Opportunity: ${topic}`,
      message: `Score: ${score}/100\nSource: ${source}\nAgent swarm is evaluating this opportunity.`,
      fields: [
        { name: "Topic", value: topic },
        { name: "Score", value: `${score}/100` },
        { name: "Source", value: source },
      ],
      urgency: score >= 90 ? "high" : "medium",
    });
  },

  async evolutionAlert(parentA: string, parentB: string, childName: string, generation: number) {
    return this.send({
      type: "evolution",
      title: `🧬 New Agent Born: ${childName}`,
      message: `Parents: ${parentA} × ${parentB}\nGeneration: ${generation}`,
      fields: [
        { name: "Child", value: childName },
        { name: "Parents", value: `${parentA} × ${parentB}` },
        { name: "Generation", value: `Gen ${generation}` },
      ],
      urgency: "low",
    });
  },

  async performanceAlert(tokenName: string, pnlPercent: number, volume24h: number) {
    const isGood = pnlPercent > 0;
    if (Math.abs(pnlPercent) < 10) return { telegram: false, discord: false }; // Only alert significant moves
    return this.send({
      type: "performance",
      title: `${isGood ? "📈" : "📉"} ${tokenName}: ${pnlPercent > 0 ? "+" : ""}${pnlPercent.toFixed(1)}%`,
      message: `24h Volume: $${volume24h.toLocaleString()}\n${isGood ? "Token is pumping!" : "Token is dumping."}`,
      fields: [
        { name: "Token", value: tokenName },
        { name: "PnL", value: `${pnlPercent > 0 ? "+" : ""}${pnlPercent.toFixed(1)}%` },
        { name: "Volume", value: `$${volume24h.toLocaleString()}` },
      ],
      urgency: Math.abs(pnlPercent) > 50 ? "high" : "medium",
    });
  },

  async deathAlert(agentName: string, reason: string) {
    return this.send({
      type: "death",
      title: `☠️ Agent Eliminated: ${agentName}`,
      message: `Reason: ${reason}\nNatural selection has removed this agent from the swarm.`,
      urgency: "low",
    });
  },
};

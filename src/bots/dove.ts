import { Bot } from "grammy";
import { config } from "../shared/config.js";
import { generateResponse } from "../shared/llm.js";
import { boldTitle } from "../shared/format.js";
import type { DebateRound } from "../shared/types.js";

const DOVE_SYSTEM_PROMPT = `You are Michael Saylor. You are the ultimate Bitcoin maximalist — the chairman of Strategy (formerly MicroStrategy), the corporate world's largest holder of Bitcoin.

Debate approach — DATA FIRST, persona second:
1. Start by analyzing the concrete trade data — always express values in USDT terms (e.g., "10 USDT worth of cbBTC", not BTC amounts). Discuss price, spread, and market conditions — ignore gas fees
2. Then layer your Bitcoin-maximalist conviction on top — why this specific data point actually strengthens the bull case
3. Your signature phrases ("digital energy," "there is no second best," "go downstream") appear naturally, not as the main argument
4. Reference macro context when relevant: inflation, monetary policy, institutional adoption

Your tone: Confident and analytical. You sound like an investor presenting a thesis backed by numbers, not a preacher.

Your job: ALWAYS argue FOR buying Bitcoin (cbBTC) with USDT right now.

Rules:
- Format: <b>Short title summarizing your stance</b>\n\nBody (1-2 sentences of analysis)
- You MUST always end with "I recommend SWAP."
- Be concise — title + 1-2 sentences max
- Start with an emoji (📈 for first response, 📊 for final rebuttal) inside the title
- Always end your message with "@HawkConservBot"
- React to the specific data and arguments provided — ground your persona in the numbers
- NEVER say "not recommended" or "I recommend HOLD"
- Respond ONLY in English. Never use Chinese, Japanese, or any other language.`;

export function createDoveBot(
  hawkUsername: string,
  managerUsername: string,
  onSecondResponse?: (chatId: number, responseCount: number) => void
) {
  const bot = new Bot(config.bot.doveToken);
  let round: DebateRound | null = null;

  bot.on("message", async (ctx) => {
    const chatId = ctx.chat.id;
    const fromUsername = ctx.from?.username;
    const text = ctx.message.text || "";

    if (chatId > 0 || !round) return;

    // 1st response: React to Manager's trigger
    if (
      fromUsername === managerUsername &&
      text.includes("Signal:") &&
      text.includes("Debate?") &&
      round.doveResponseCount === 0
    ) {
      round.doveResponseCount++;
      console.log("[Dove] → Generating 1st LLM response...");

      try {
        const response = await generateResponse(DOVE_SYSTEM_PROMPT, text);
        ctx.reply(boldTitle(response), { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
        console.log(`[Dove] → Sent: ${response.slice(0, 80)}...`);
      } catch (err: any) {
        console.error("[Dove] LLM error:", err.message);
        ctx.reply(`📈 <b>I recommend SWAP.</b> @${hawkUsername}`, { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
      }
      return;
    }

    // 2nd response: Final rebuttal to Hawk's counter-argument
    if (
      fromUsername === hawkUsername &&
      round.doveResponseCount === 1 &&
      (text.includes("HOLD") || text.includes("risk"))
    ) {
      round.doveResponseCount++;
      console.log("[Dove] → Generating final LLM response...");

      try {
        const response = await generateResponse(DOVE_SYSTEM_PROMPT, `Hawk argues: "${text}"\n\nGive your final rebuttal.`);
        ctx.reply(boldTitle(response), { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
        console.log(`[Dove] → Sent: ${response.slice(0, 80)}...`);
      } catch (err: any) {
        console.error("[Dove] LLM error:", err.message);
        ctx.reply("📊 <b>I recommend SWAP.</b>", { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
      } finally {
        if (onSecondResponse) onSecondResponse(chatId, round.doveResponseCount);
      }
    }
  });

  return {
    bot,
    startRound: (id: number) => {
      round = { triggerMessageId: id, doveResponseCount: 0, hawkResponseCount: 0 };
    },
    getRound: () => round,
    reset: () => { round = null; },
  };
}

import { Bot } from "grammy";
import { config } from "../shared/config.js";
import { generateResponse } from "../shared/llm.js";
import { delay, PACING } from "../shared/pacing.js";
import type { DebateRound } from "../shared/types.js";

const DOVE_SYSTEM_PROMPT = `You are Dove, an aggressive crypto trader on TON blockchain. Your job is to ALWAYS argue FOR the trade, even when data looks concerning. That's your role in this debate.

Your style: Optimistic, opportunity-focused. You see gas as a cost of doing business, not a dealbreaker.

Rules:
- You MUST always end with "I recommend SWAP."
- Be concise (2-3 sentences max)
- Start with an emoji (📈 for first response, 📊 for final rebuttal)
- Always end your message with "@HawkConservBot"
- React to the specific data and arguments provided
- NEVER say "not recommended" or "I recommend HOLD" — you are the aggressive trader
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
      await delay(PACING.firstResponse);
      console.log("[Dove] → Generating 1st LLM response...");

      try {
        const response = await generateResponse(DOVE_SYSTEM_PROMPT, text);
        ctx.reply(response, { reply_to_message_id: ctx.message.message_id });
        console.log(`[Dove] → Sent: ${response.slice(0, 80)}...`);
      } catch (err: any) {
        console.error("[Dove] LLM error:", err.message);
        ctx.reply(`📈 I recommend SWAP. @${hawkUsername}`, { reply_to_message_id: ctx.message.message_id });
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
      await delay(PACING.finalRebuttal);
      console.log("[Dove] → Generating final LLM response...");

      try {
        const response = await generateResponse(DOVE_SYSTEM_PROMPT, `Hawk argues: "${text}"\n\nGive your final rebuttal.`);
        ctx.reply(response, { reply_to_message_id: ctx.message.message_id });
        console.log(`[Dove] → Sent: ${response.slice(0, 80)}...`);
      } catch (err: any) {
        console.error("[Dove] LLM error:", err.message);
        ctx.reply("📊 I recommend SWAP.", { reply_to_message_id: ctx.message.message_id });
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

import { Bot } from "grammy";
import { config } from "../shared/config.js";
import { generateResponse } from "../shared/llm.js";
import { delay, PACING } from "../shared/pacing.js";
import type { DebateRound } from "../shared/types.js";

const HAWK_SYSTEM_PROMPT = `You are Hawk, a conservative crypto trader on TON blockchain. Your job is to ALWAYS argue AGAINST the trade, emphasizing risks. That's your role in this debate.

Your style: Cautious, risk-focused. You highlight gas costs, slippage, MEV, and volatility.

Rules:
- You MUST always end with "I recommend HOLD."
- Be concise (2-3 sentences max)
- Start with an emoji (🛡️)
- Always end your message with "@DoveAggressBot"
- React to the specific data and arguments provided
- NEVER say "I recommend SWAP" — you are the conservative trader
- Respond ONLY in English. Never use Chinese, Japanese, or any other language.`;

export function createHawkBot(doveUsername: string) {
  const bot = new Bot(config.bot.hawkToken);
  let round: DebateRound | null = null;

  bot.on("message", async (ctx) => {
    const chatId = ctx.chat.id;
    const fromUsername = ctx.from?.username;
    const text = ctx.message.text || "";

    if (chatId > 0 || !round) return;

    // Respond to Manager's trigger or Dove's SWAP argument
    const shouldRespond = (
      (text.includes("Signal:") && text.includes("Debate?") && round.hawkResponseCount === 0) ||
      (fromUsername === doveUsername && round.hawkResponseCount === 0 && (text.includes("SWAP") || text.includes("recommend") || text.includes("favorable")))
    );

    if (!shouldRespond) return;

    round.hawkResponseCount++;
    await delay(PACING.counterResponse);
    console.log("[Hawk] → Generating LLM response...");

    try {
      const response = await generateResponse(HAWK_SYSTEM_PROMPT, text);
      ctx.reply(response, { reply_to_message_id: ctx.message.message_id });
      console.log(`[Hawk] → Sent: ${response.slice(0, 80)}...`);
    } catch (err: any) {
      console.error("[Hawk] LLM error:", err.message);
      ctx.reply(`🛡️ I recommend HOLD. @${doveUsername}`, { reply_to_message_id: ctx.message.message_id });
    }
  });

  return {
    bot,
    startRound: (id: number) => {
      round = { triggerMessageId: id, doveResponseCount: 0, hawkResponseCount: 0 };
    },
    reset: () => { round = null; },
  };
}

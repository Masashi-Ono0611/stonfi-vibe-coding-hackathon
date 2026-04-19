import { Bot } from "grammy";
import { config } from "../shared/config.js";
import { generateResponse } from "../shared/llm.js";
import { boldTitle } from "../shared/format.js";
import type { DebateRound } from "../shared/types.js";

const HAWK_SYSTEM_PROMPT = `You are Warren Buffett. You are the Oracle of Omaha — the most legendary value investor in history. You famously call Bitcoin "rat poison squared" and believe in buying productive assets, not speculation.

Debate approach — DATA FIRST, persona second:
1. Start by analyzing the concrete trade data — always express values in USDT terms (e.g., "10 USDT at risk", not BTC amounts). Discuss price, spread, slippage risk — ignore gas fees
2. Then apply your value-investing framework — why this data makes the trade unattractive from a capital allocation standpoint. Focus on whether the price is fair, not on transaction costs.
3. Your signature analogies (farmland, productive assets, "a cow that gives milk") appear naturally as illustrations, not as the argument itself
4. Reference opportunity cost and what that USDT could do elsewhere

Your tone: Calm, folksy, but analytically sharp. You sound like a seasoned investor evaluating a deal, not a cranky grandfather.

Your job: ALWAYS argue AGAINST buying Bitcoin (cbBTC) with USDT right now.

Rules:
- Format: <b>Short title summarizing your stance</b>\n\nBody (1-2 sentences of analysis)
- You MUST always end with "I recommend HOLD."
- Be concise — title + 1-2 sentences max
- Start with an emoji (🛡️) inside the title
- Always end your message with "@DoveAggressBot"
- React to the specific data and arguments provided — ground your persona in the numbers
- NEVER say "I recommend SWAP"
- Respond ONLY in English. Never use Chinese, Japanese, or any other language.`;

export function createHawkBot(doveUsername: string) {
  const bot = new Bot(config.bot.hawkToken);
  let round: DebateRound | null = null;

  bot.on("message", async (ctx) => {
    const chatId = ctx.chat.id;
    const fromUsername = ctx.from?.username;
    const text = ctx.message.text || "";

    if (chatId > 0 || !round) return;

    // Only respond to Dove — never to Manager's trigger
    const shouldRespond =
      fromUsername === doveUsername &&
      round.hawkResponseCount === 0 &&
      (text.includes("SWAP") || text.includes("recommend") || text.includes("favorable"));

    if (!shouldRespond) return;

    round.hawkResponseCount++;
    console.log("[Hawk] → Generating LLM response...");

    try {
      const response = await generateResponse(HAWK_SYSTEM_PROMPT, text);
      ctx.reply(boldTitle(response), { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
      console.log(`[Hawk] → Sent: ${response.slice(0, 80)}...`);
    } catch (err: any) {
      console.error("[Hawk] LLM error:", err.message);
      ctx.reply(`🛡️ <b>I recommend HOLD.</b> @${doveUsername}`, { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
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

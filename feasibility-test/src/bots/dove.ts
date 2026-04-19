import { Bot } from "grammy";
import { config } from "../shared/config.js";
import type { DebateRound } from "../shared/types.js";

export function createDoveBot(hawkUsername: string, managerUsername: string) {
  const bot = new Bot(config.botDoveToken);
  let round: DebateRound | null = null;

  bot.on("message", (ctx) => {
    const chatId = ctx.chat.id;
    const fromUsername = ctx.from?.username;
    const text = ctx.message.text || "";

    console.log(
      `[Dove] Received in chat ${chatId}: "${text.slice(0, 60)}" from @${fromUsername}`
    );

    if (chatId > 0) return;
    if (!round) return;

    // 1st response: React to Manager's trigger
    if (
      fromUsername === managerUsername &&
      text.includes("Should we swap") &&
      round.doveResponseCount === 0
    ) {
      round.doveResponseCount++;
      console.log(`[Dove] → 1st response (count=${round.doveResponseCount}): PRO SWAP`);
      ctx.reply(
        `📈 RFQ shows favorable rate. Current spread is within 1% tolerance. I recommend SWAP. @${hawkUsername}`,
        { reply_to_message_id: ctx.message.message_id }
      );
      return;
    }

    // 2nd response: Final rebuttal to Hawk's counter-argument
    if (
      fromUsername === hawkUsername &&
      round.doveResponseCount === 1 &&
      (text.includes("HOLD") || text.includes("risk"))
    ) {
      round.doveResponseCount++;
      console.log(`[Dove] → 2nd response (count=${round.doveResponseCount}): Final SWAP`);
      ctx.reply(
        "📊 Spread is within acceptable range and volatility is normalizing. This is the optimal window. Final recommendation: SWAP.",
        { reply_to_message_id: ctx.message.message_id }
      );
    }
  });

  return {
    bot,
    startRound: (triggerMessageId: number) => {
      round = { triggerMessageId, doveResponseCount: 0, hawkResponseCount: 0, maxRoundsPerBot: 2 };
    },
    reset: () => { round = null; },
  };
}

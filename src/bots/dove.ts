import { Bot } from "grammy";
import { config } from "../shared/config.js";
import type { DebateRound } from "../shared/types.js";

export function createDoveBot(hawkUsername: string, managerUsername: string) {
  const bot = new Bot(config.bot.doveToken);
  let round: DebateRound | null = null;

  bot.on("message", (ctx) => {
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
      console.log(`[Dove] → 1st response (count=${round.doveResponseCount}): PRO SWAP`);
      ctx.reply(
        `📈 RFQ from ${(text.match(/Resolver: (\S+)/)?.[1]) || "LP"} shows ${text.match(/([\d.]+) TON → ([\d.]+) STON/)?.[0] || "favorable rate"}. I recommend SWAP. @${hawkUsername}`,
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
        "📊 Price opportunity is clear and this window won't last. Execution cost is marginal at this size. Final recommendation: SWAP.",
        { reply_to_message_id: ctx.message.message_id }
      );
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

import { Bot } from "grammy";
import { config } from "../shared/config.js";
import type { DebateRound } from "../shared/types.js";

export function createHawkBot(doveUsername: string, managerUsername: string) {
  const bot = new Bot(config.botHawkToken);
  let round: DebateRound | null = null;

  bot.on("message", (ctx) => {
    const chatId = ctx.chat.id;
    const fromUsername = ctx.from?.username;
    const text = ctx.message.text || "";

    console.log(
      `[Hawk] Received in chat ${chatId}: "${text.slice(0, 60)}" from @${fromUsername}`
    );

    if (chatId > 0) return;
    if (!round) return;

    // React to Dove's initial proposal
    if (
      fromUsername === doveUsername &&
      round.hawkResponseCount === 0 &&
      (text.includes("SWAP") || text.includes("recommend") || text.includes("favorable"))
    ) {
      round.hawkResponseCount++;
      console.log(`[Hawk] → 1st response (count=${round.hawkResponseCount}): HOLD`);
      ctx.reply(
        `🛡️ 1% spread is not enough margin given current gas fees and MEV risk on TON. The cost of execution outweighs the gain. HOLD. @${doveUsername}`,
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

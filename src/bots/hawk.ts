import { Bot } from "grammy";
import { config } from "../shared/config.js";
import type { DebateRound } from "../shared/types.js";

export function createHawkBot(doveUsername: string) {
  const bot = new Bot(config.bot.hawkToken);
  let round: DebateRound | null = null;

  bot.on("message", (ctx) => {
    const chatId = ctx.chat.id;
    const fromUsername = ctx.from?.username;
    const text = ctx.message.text || "";

    if (chatId > 0 || !round) return;

    // Respond to Manager's trigger
    if (text.includes("Signal:") && text.includes("Debate?") && round.hawkResponseCount === 0) {
      round.hawkResponseCount++;
      console.log("[Hawk] → Responding to trigger: HOLD");
      const gasMatch = text.match(/Gas: (\S+)/);
      const gas = gasMatch ? gasMatch[1] : "N/A";
      ctx.reply(
        `🛡️ Gas costs (${gas} TON) eat into any marginal gain. MEV risk on TON is non-trivial. I recommend HOLD. @${doveUsername}`,
        { reply_to_message_id: ctx.message.message_id }
      );
      return;
    }

    // Respond to Dove's SWAP argument
    if (
      fromUsername === doveUsername &&
      round.hawkResponseCount === 0 &&
      (text.includes("SWAP") || text.includes("recommend") || text.includes("favorable"))
    ) {
      round.hawkResponseCount++;
      console.log("[Hawk] → Counter-argument: HOLD");
      ctx.reply(
        `🛡️ The price alone doesn't justify execution. We must account for gas fees, slippage on execution, and MEV exposure. HOLD. @${doveUsername}`,
        { reply_to_message_id: ctx.message.message_id }
      );
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

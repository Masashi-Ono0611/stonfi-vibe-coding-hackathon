import { Bot } from "grammy";
import { config } from "../shared/config.js";

export function createManagerBot(onDebateStart: (triggerMessageId: number) => void) {
  const bot = new Bot(config.botManagerToken);

  bot.on("message", (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text || "";

    console.log(
      `[Manager] Received in chat ${chatId}: "${text.slice(0, 60)}" from @${ctx.from?.username}`
    );

    if (ctx.message.text?.startsWith("/debate") && chatId < 0) {
      const msg = ctx.reply(
        "📊 Signal: TON/STON spread 2.3%. Should we swap? @HawkConservBot @DoveAggressBot"
      );
      msg.then((m) => {
        console.log(`[Manager] Trigger sent, message_id=${m.message_id}`);
        onDebateStart(m.message_id);
      });
    }
  });

  return bot;
}

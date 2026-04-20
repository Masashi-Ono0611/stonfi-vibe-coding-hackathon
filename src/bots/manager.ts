import { Bot } from "grammy";
import { InputFile } from "grammy";
import { config } from "../shared/config.js";
import { buildSwapDeepLink } from "../omniston/swap.js";
import { renderBuySignal } from "../shared/render.js";
import type { QuoteData } from "../shared/types.js";

interface DebateCallbacks {
  onDebateStart: (triggerMessageId: number) => void;
  onDebateEnd: () => void;
  getLatestQuote: () => QuoteData | null;
}

export function createManagerBot(callbacks: DebateCallbacks) {
  const bot = new Bot(config.bot.managerToken);
  let debateActive = false;

  function buildTriggerMessage(data?: QuoteData): string {
    if (data) {
      return [
        `📊 Signal: USDT/cbBTC — ${data.bidUnits} USDT → ${data.askUnits} cbBTC`,
        `   1 cbBTC = $${data.price} | Resolver: ${data.resolverName}`,
        "   Debate?",
      ].join("\n");
    }
    return "📊 Signal: USDT/cbBTC — monitoring active. Debate?";
  }

  async function announceDecision(chatId: number, doveResponseCount: number) {
    await new Promise((r) => setTimeout(r, 2000));
    if (!debateActive) return;
    if (doveResponseCount >= 2) {
      const quote = callbacks.getLatestQuote();
      const swapLink = buildSwapDeepLink();
      if (quote) {
        try {
          const image = await renderBuySignal();
          await bot.api.sendPhoto(chatId, new InputFile(image), {
            caption: [
              "✅ Decision: SWAP",
              "",
              `1 cbBTC = $${quote.price}`,
              "",
              "🔗 Execute Swap",
              swapLink,
            ].join("\n"),
          });
        } catch (renderError) {
          console.error("[Manager] Image generation failed, falling back to text:", renderError);
          await bot.api.sendMessage(chatId, [
            "✅ Decision: SWAP",
            "",
            `1 cbBTC = $${quote.price}`,
            "",
            "🔗 Execute Swap",
            swapLink,
          ].join("\n"));
        }
      } else {
        await bot.api.sendMessage(chatId, [
          "✅ Decision: SWAP",
          "",
          "🔗 Execute Swap",
          swapLink,
        ].join("\n"));
      }
    } else {
      await bot.api.sendMessage(chatId, "⏸ Decision: HOLD (insufficient debate)");
    }
    debateActive = false;
    callbacks.onDebateEnd();
  }

  bot.on("message", (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text || "";

    // /debate command — manual trigger
    if (text.startsWith("/debate") && chatId < 0 && !debateActive) {
      if (config.bot.groupChatId && String(chatId) !== config.bot.groupChatId) return;
      debateActive = true;
      const quote = callbacks.getLatestQuote();
      callbacks.onDebateStart(-1);
      ctx.reply(buildTriggerMessage(quote || undefined));
      return;
    }
  });

  return {
    bot,
    // Called after Dove's final rebuttal
    onDebateComplete: (chatId: number, doveResponseCount: number) => {
      announceDecision(chatId, doveResponseCount);
    },
    isDebateActive: () => debateActive,
  };
}

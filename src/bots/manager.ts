import { Bot } from "grammy";
import { config } from "../shared/config.js";
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
        `📊 Signal: TON/STON — ${data.bidUnits} TON → ${data.askUnits} STON`,
        `   Price: ${data.price} | Resolver: ${data.resolverName} | Gas: ${data.gasBudget} TON`,
        "   Debate?",
      ].join("\n");
    }
    return "📊 Signal: TON/STON — monitoring active. Debate?";
  }

  async function announceDecision(chatId: number, doveResponseCount: number) {
    await new Promise((r) => setTimeout(r, 2000));
    if (!debateActive) return;
    if (doveResponseCount >= 2) {
      await bot.api.sendMessage(chatId, "✅ Decision: SWAP (Dove's final stance)");
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

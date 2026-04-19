import { createManagerBot } from "./bots/manager.js";
import { createHawkBot } from "./bots/hawk.js";
import { createDoveBot } from "./bots/dove.js";
import { startMonitoring, isMonitoring, getLatestQuote } from "./omniston/rfq.js";

const HAWK_USERNAME = "HawkConservBot";
const DOVE_USERNAME = "DoveAggressBot";
const MANAGER_USERNAME = "HawkDoveManagerBot";

async function main() {
  console.log("=== Hawk & Dove — Two-Bot Trading Council ===\n");

  const hawk = createHawkBot(DOVE_USERNAME);
  const dove = createDoveBot(HAWK_USERNAME, MANAGER_USERNAME);
  const manager = createManagerBot({
    onDebateStart: () => {
      console.log("[System] Debate started");
      hawk.startRound(-1);
      dove.startRound(-1);
    },
    onDebateEnd: () => {
      console.log("[System] Debate ended");
      hawk.reset();
      dove.reset();
    },
    getLatestQuote,
  });

  // After Dove's 2nd response, trigger Manager's decision
  dove.bot.on("message", (ctx) => {
    const round = dove.getRound();
    if (!round || ctx.chat.id > 0) return;
    if (round.doveResponseCount >= 2) {
      setTimeout(() => {
        manager.onDebateComplete(ctx.chat.id, round.doveResponseCount);
      }, 1000);
    }
  });

  // Start Omniston RFQ monitoring (for live data in debates)
  startMonitoring();

  if (isMonitoring()) {
    console.log("[Setup] Omniston RFQ monitoring active (manual /debate trigger only).");
  } else {
    console.log("[Setup] Omniston RFQ monitoring not started.");
  }

  // Start all bots (long-running — never resolves)
  console.log("[Setup] Starting all 3 bots...\n");

  await Promise.all([
    manager.bot.start({
      onStart: (info) => console.log(`[Manager] Started as @${info.username}`),
    }),
    hawk.bot.start({
      onStart: (info) => console.log(`[Hawk] Started as @${info.username}`),
    }),
    dove.bot.start({
      onStart: (info) => console.log(`[Dove] Started as @${info.username}`),
    }),
  ]);
}

main().catch(console.error);

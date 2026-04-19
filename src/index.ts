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
  const dove = createDoveBot(HAWK_USERNAME, MANAGER_USERNAME, (chatId, count) => {
    setTimeout(() => {
      manager.onDebateComplete(chatId, count);
    }, 1000);
  });
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

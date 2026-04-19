import { createManagerBot } from "./bots/manager.js";
import { createHawkBot } from "./bots/hawk.js";
import { createDoveBot } from "./bots/dove.js";

const HAWK_USERNAME = "HawkConservBot";
const DOVE_USERNAME = "DoveAggressBot";
const MANAGER_USERNAME = "HawkDoveManagerBot";

async function main() {
  console.log("=== Hawk & Dove Feasibility Test ===\n");

  const hawk = createHawkBot(DOVE_USERNAME, MANAGER_USERNAME);
  const dove = createDoveBot(HAWK_USERNAME, MANAGER_USERNAME);
  const manager = createManagerBot((triggerMessageId) => {
    console.log(`[System] Debate started (trigger message_id=${triggerMessageId})`);
    hawk.startRound(triggerMessageId);
    dove.startRound(triggerMessageId);
  });

  console.log("[Setup] Starting all 3 bots...\n");

  await Promise.all([
    manager.start({
      onStart: (info) => console.log(`[Manager] Started as @${info.username}`),
    }),
    hawk.bot.start({
      onStart: (info) => console.log(`[Hawk] Started as @${info.username}`),
    }),
    dove.bot.start({
      onStart: (info) => console.log(`[Dove] Started as @${info.username}`),
    }),
  ]);

  console.log("\n[Setup] All bots running.");
  console.log("[Setup] Send /debate in the group chat to trigger a test debate.");
  console.log("[Setup] Press Ctrl+C to stop.\n");
}

main().catch(console.error);

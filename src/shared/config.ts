import "dotenv/config";

export const config = {
  bot: {
    managerToken: process.env.BOT_MANAGER_TOKEN!,
    hawkToken: process.env.BOT_HAWK_TOKEN!,
    doveToken: process.env.BOT_DOVE_TOKEN!,
    groupChatId: process.env.GROUP_CHAT_ID,
  },
  omniston: {
    wsUrl: process.env.OMNISTON_WS_URL || "wss://omni-ws.ston.fi",
    usdtAddress: process.env.USDT_ADDRESS || "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
    cbbtcAddress: process.env.CBBTC_ADDRESS || "EQDhyPzbIjJT_WnY3gGprjSYUK9fiGMjWMezxO8MZiUdfb_B",
    swapAmount: process.env.SWAP_AMOUNT || "10000000",
  },
  llm: {
    baseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
    authToken: process.env.ANTHROPIC_AUTH_TOKEN,
  },
};

const { bot, omniston, llm } = config;
for (const [key, val] of Object.entries(bot)) {
  if (!val) console.log(`[WARN] bot.${key} is not set`);
}
if (!llm.authToken) console.log("[WARN] LLM: ANTHROPIC_AUTH_TOKEN is not set");
if (bot.groupChatId) console.log(`[Config] GROUP_CHAT_ID: ${bot.groupChatId}`);
else console.log("[INFO] GROUP_CHAT_ID not set — /debate works in any group");
console.log(`[Config] Omniston: ${omniston.wsUrl} | LLM: ${llm.baseUrl}`);

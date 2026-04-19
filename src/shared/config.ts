import "dotenv/config";

export const config = {
  bot: {
    managerToken: process.env.BOT_MANAGER_TOKEN!,
    hawkToken: process.env.BOT_HAWK_TOKEN!,
    doveToken: process.env.BOT_DOVE_TOKEN!,
  },
  omniston: {
    wsUrl: process.env.OMNISTON_WS_URL || "wss://omni-ws.ston.fi",
    tonAddress: process.env.TON_ADDRESS || "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
    stonAddress: process.env.STON_ADDRESS || "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO",
    swapAmount: process.env.SWAP_AMOUNT || "1000000000",
  },
};

const { bot, omniston } = config;
for (const [key, val] of Object.entries(bot)) {
  if (!val) console.log(`[WARN] bot.${key} is not set`);
}
console.log(`[Config] Omniston: ${omniston.wsUrl}`);

import "dotenv/config";

export const config = {
  botManagerToken: process.env.BOT_MANAGER_TOKEN!,
  botHawkToken: process.env.BOT_HAWK_TOKEN!,
  botDoveToken: process.env.BOT_DOVE_TOKEN!,
  groupChatId: process.env.GROUP_CHAT_ID ? Number(process.env.GROUP_CHAT_ID) : null,
};

for (const [key, val] of Object.entries(config)) {
  if (!val) console.log(`[WARN] ${key} is not set`);
}

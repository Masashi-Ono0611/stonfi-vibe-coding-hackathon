import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function renderBuySignal(): Promise<Buffer> {
  return readFile(join(__dirname, "swap-signal.png"));
}

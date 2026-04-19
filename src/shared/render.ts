import { createCanvas, loadImage } from "@napi-rs/canvas";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { QuoteData } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function renderBuySignal(data: QuoteData): Promise<Buffer> {
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background — dark with green gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, "#0d1117");
  bgGrad.addColorStop(1, "#0a1a0f");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Top accent line
  ctx.fillStyle = "#00d26a";
  ctx.fillRect(0, 0, width, 4);

  // BTC icon
  const btcIcon = await loadImage(join(__dirname, "btc.png"));
  ctx.drawImage(btcIcon, 36, 56, 48, 48);

  // "BUY BITCOIN" title
  ctx.font = "bold 42px sans-serif";
  ctx.fillStyle = "#00d26a";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("BUY BITCOIN", 100, 78);

  // Price tag
  ctx.font = "600 20px sans-serif";
  ctx.fillStyle = "#8b949e";
  ctx.fillText("1 cbBTC =", 40, 150);
  ctx.font = "bold 36px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`$${data.price}`, 180, 152);

  // Divider
  ctx.strokeStyle = "#21262d";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 200);
  ctx.lineTo(width - 40, 200);
  ctx.stroke();

  // Trade details
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#8b949e";
  ctx.fillText(`Spend`, 40, 240);
  ctx.fillText(`Receive`, 40, 275);
  ctx.fillText(`Resolver`, 40, 310);

  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${data.bidUnits} USDT`, 140, 240);
  ctx.fillText(`${data.askUnits} cbBTC`, 140, 275);
  ctx.fillStyle = "#00d26a";
  ctx.fillText(data.resolverName, 140, 310);

  // Bottom accent bar
  const barGrad = ctx.createLinearGradient(0, 0, width, 0);
  barGrad.addColorStop(0, "#00d26a");
  barGrad.addColorStop(1, "#00a854");
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, height - 50, width, 50);

  // Bottom text
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "#0d1117";
  ctx.textAlign = "center";
  ctx.fillText("SWAP NOW ON STON.FI", width / 2, height - 22);

  return canvas.toBuffer("image/png");
}

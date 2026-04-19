import { config } from "../shared/config.js";

export function buildSwapDeepLink(): string {
  const params = new URLSearchParams({
    ft: config.omniston.usdtAddress,
    tt: config.omniston.cbbtcAddress,
    in: config.omniston.swapAmount,
  });
  return `https://app.ston.fi/swap?${params.toString()}`;
}

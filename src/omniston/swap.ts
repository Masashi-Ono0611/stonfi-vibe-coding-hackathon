import { config } from "../shared/config.js";

export function buildSwapDeepLink(): string {
  const params = new URLSearchParams({
    ft: "TON",
    tt: config.omniston.stonAddress,
    in: config.omniston.swapAmount,
  });
  return `https://app.ston.fi/swap?${params.toString()}`;
}

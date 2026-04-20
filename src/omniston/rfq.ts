import { Omniston, SettlementMethod, GaslessSettlement } from "@ston-fi/omniston-sdk";
import { config } from "../shared/config.js";
import type { QuoteData } from "../shared/types.js";

let subscription: any = null;
let lastQuoteId: string | null = null;
let monitoring = false;
let omnistonInstance: any = null;
let latestQuote: QuoteData | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

function formatUsdt(units: string): string {
  return (Number(units) / 1e6).toFixed(2);
}

function formatCbbtc(units: string): string {
  return (Number(units) / 1e8).toFixed(8);
}

export function getLatestQuote(): QuoteData | null {
  return latestQuote;
}

function cleanup() {
  if (subscription) {
    try {
      subscription.unsubscribe();
    } catch (err) {
      // Ignore cleanup errors
    }
    subscription = null;
  }
  if (omnistonInstance) {
    try {
      omnistonInstance.disconnect();
    } catch (err) {
      // Ignore cleanup errors
    }
    omnistonInstance = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  lastQuoteId = null;
}

function scheduleReconnect() {
  if (!monitoring) return;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  reconnectTimer = setTimeout(() => {
    console.log("[RFQ] Attempting to reconnect...");
    monitoring = false;
    cleanup();
    startMonitoring();
  }, 5000); // Reconnect after 5 seconds
}

export function startMonitoring() {
  if (monitoring) {
    console.log("[RFQ] Already monitoring, skipping");
    return;
  }

  monitoring = true;

  try {
    omnistonInstance = new Omniston({ apiUrl: config.omniston.wsUrl });

    console.log(`[RFQ] Connecting to ${config.omniston.wsUrl}...`);

    const rfq = {
      bidAssetAddress: {
        blockchain: 607, // TON SLIP-044
        address: config.omniston.usdtAddress,
      },
      askAssetAddress: {
        blockchain: 607, // TON SLIP-044
        address: config.omniston.cbbtcAddress,
      },
      amount: {
        bidUnits: config.omniston.swapAmount,
      },
      settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
      settlementParams: {
        maxPriceSlippageBps: 100,
        gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_PROHIBITED,
      },
    };

    subscription = omnistonInstance.requestForQuote(rfq).subscribe({
      next: (event: any) => {
        if (event.type === "ack") {
          console.log(`[RFQ] Subscribed (rfqId=${event.rfqId})`);
          return;
        }

        if (event.type === "noQuote") {
          console.log("[RFQ] No quotes available");
          return;
        }

        if (event.type === "quoteUpdated") {
          const q = event.quote;

          if (q.quoteId === lastQuoteId) return;
          lastQuoteId = q.quoteId;

          const bidUsdt = Number(q.bidUnits) / 1e6;
          const askBtc = Number(q.askUnits) / 1e8;
          const priceUsdtPerBtc = bidUsdt / askBtc;

          latestQuote = {
            bidUnits: formatUsdt(q.bidUnits),
            askUnits: formatCbbtc(q.askUnits),
            price: priceUsdtPerBtc.toFixed(2),
            resolverName: q.resolverName || "unknown",
            gasBudget: q.gasBudget ? String(Number(q.gasBudget) / 1e9) : "N/A",
          };

          console.log(
            `[RFQ] Quote: ${formatUsdt(q.bidUnits)} USDT → ${formatCbbtc(q.askUnits)} cbBTC (1 cbBTC = $${latestQuote.price}, ${q.resolverName})`
          );
        }
      },
      error: (err: any) => {
        console.error("[RFQ] Stream error:", err.message);
        console.log("[RFQ] Cleaning up and scheduling reconnection...");
        cleanup();
        scheduleReconnect();
      },
      complete: () => {
        console.log("[RFQ] Stream completed (server closed connection)");
        cleanup();
        scheduleReconnect();
      },
    });

    console.log("[RFQ] RFQ subscription active");
  } catch (err: any) {
    console.error("[RFQ] Failed to start monitoring:", err.message);
    console.log("[RFQ] Bots will run in manual mode (use /debate)");
    cleanup();
    scheduleReconnect();
  }
}

export function stopMonitoring() {
  cleanup();
  monitoring = false;
  latestQuote = null;
  console.log("[RFQ] Stopped");
}

export function isMonitoring(): boolean {
  return monitoring;
}

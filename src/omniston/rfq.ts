import { Omniston, SettlementMethod, GaslessSettlement } from "@ston-fi/omniston-sdk";
import { config } from "../shared/config.js";
import type { QuoteData } from "../shared/types.js";

let subscription: any = null;
let lastQuoteId: string | null = null;
let monitoring = false;
let latestQuote: QuoteData | null = null;

function formatTon(units: string): string {
  return (Number(units) / 1e9).toFixed(2);
}

export function getLatestQuote(): QuoteData | null {
  return latestQuote;
}

export function startMonitoring() {
  if (monitoring) return;
  monitoring = true;

  try {
    const omniston = new Omniston({ apiUrl: config.omniston.wsUrl });

    console.log(`[RFQ] Connecting to ${config.omniston.wsUrl}...`);

    const rfq = {
      bidAssetAddress: {
        blockchain: 607, // TON SLIP-044
        address: config.omniston.tonAddress,
      },
      askAssetAddress: {
        blockchain: 607, // TON SLIP-044
        address: config.omniston.stonAddress,
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

    subscription = omniston.requestForQuote(rfq).subscribe({
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

          const bidNum = Number(q.bidUnits);
          const askNum = Number(q.askUnits);
          const price = askNum / bidNum;

          latestQuote = {
            bidUnits: formatTon(q.bidUnits),
            askUnits: formatTon(q.askUnits),
            price: price.toFixed(6),
            resolverName: q.resolverName || "unknown",
            gasBudget: q.gasBudget ? String(Number(q.gasBudget) / 1e9) : "N/A",
          };

          console.log(
            `[RFQ] Quote: ${formatTon(q.bidUnits)} TON → ${formatTon(q.askUnits)} STON (price: ${latestQuote.price}, ${q.resolverName})`
          );
        }
      },
      error: (err: any) => {
        console.error("[RFQ] Stream error:", err.message);
      },
    });

    console.log("[RFQ] RFQ subscription active");
  } catch (err: any) {
    console.error("[RFQ] Failed to start monitoring:", err.message);
    console.log("[RFQ] Bots will run in manual mode (use /debate)");
    monitoring = false;
  }
}

export function stopMonitoring() {
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }
  monitoring = false;
  lastQuoteId = null;
  console.log("[RFQ] Stopped");
}

export function isMonitoring(): boolean {
  return monitoring;
}

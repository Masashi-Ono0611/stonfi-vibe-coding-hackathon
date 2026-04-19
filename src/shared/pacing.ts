/** Natural-feeling delays to simulate human reading/thinking time */

export const PACING = {
  /** First response after trigger (Dove reads signal, thinks) */
  firstResponse: { minMs: 3000, maxMs: 6000 },
  /** Counter-argument (Hawk reads Dove's take, formulates pushback) */
  counterResponse: { minMs: 5000, maxMs: 9000 },
  /** Final rebuttal (Dove considers Hawk's points, delivers closer) */
  finalRebuttal: { minMs: 6000, maxMs: 10000 },
  /** Manager decision announcement after debate */
  decisionPause: { minMs: 4000, maxMs: 7000 },
  /** Callback from Dove's 2nd response to manager decision (existing gap) */
  debateCompleteGap: 1000,
} as const;

function randomInRange(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

export function delay(range: { minMs: number; maxMs: number }): Promise<void> {
  const ms = randomInRange(range.minMs, range.maxMs);
  console.log(`[Pacing] Waiting ${ms}ms before responding...`);
  return new Promise((r) => setTimeout(r, ms));
}

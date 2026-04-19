export const DEBATE_STATES = {
  IDLE: "idle",
  DEBATING: "debating",
} as const;

export type DebateState = (typeof DEBATE_STATES)[keyof typeof DEBATE_STATES];

export interface DebateRound {
  triggerMessageId: number;
  doveResponseCount: number;
  hawkResponseCount: number;
  maxRoundsPerBot: number;
}

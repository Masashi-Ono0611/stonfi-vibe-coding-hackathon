export interface DebateRound {
  triggerMessageId: number;
  doveResponseCount: number;
  hawkResponseCount: number;
}

export interface QuoteData {
  bidUnits: string;
  askUnits: string;
  price: string;
  resolverName: string;
  gasBudget: string;
}

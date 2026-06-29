export enum BetType {
  SINGLE = "SINGLE",
  MULTI = "MULTI",
}

export enum BetStatus {
  PENDING = "PENDING",
  WON = "WON",
  LOST = "LOST",
  CANCELLED = "CANCELLED",
  CASHED_OUT = "CASHED_OUT",
}

export enum BetLegStatus {
  PENDING = "PENDING",
  WON = "WON",
  LOST = "LOST",
  VOID = "VOID",
}

export interface PlaceBetRequest {
  stake: number;
  type: BetType;
  legs: {
    marketId: string;
    oddsId: string;
  }[];
}

export interface BetResponse {
  id: string;
  userId: string;
  type: BetType;
  stake: number;
  totalOdds: number;
  potentialWin: number;
  status: BetStatus;
  cashoutAmount?: number;
  createdAt: string;
  settledAt?: string;
  legs: BetLegResponse[];
}

export interface BetLegResponse {
  id: string;
  marketId: string;
  oddsId: string;
  oddsValue: number;
  status: BetLegStatus;
  settledAt?: string;
  market?: string;
  selection?: string;
}

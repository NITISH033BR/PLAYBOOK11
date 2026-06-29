export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  LIVE = "LIVE",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
  POSTPONED = "POSTPONED",
}

export enum MarketType {
  MATCH_ODDS = "MATCH_ODDS",
  WIN_DRAW_WIN = "WIN_DRAW_WIN",
  BOOKMAKER = "BOOKMAKER",
  SESSION = "SESSION",
  FANCY = "FANCY",
  PLAYER_RUNS = "PLAYER_RUNS",
  PLAYER_BOUNDARIES = "PLAYER_BOUNDARIES",
  FALL_OF_WICKET = "FALL_OF_WICKET",
  TOTAL_RUNS = "TOTAL_RUNS",
  OVER_RUNS = "OVER_RUNS",
  YES_NO = "YES_NO",
  OVER_UNDER = "OVER_UNDER",
  BOTH_TEAMS_SCORE = "BOTH_TEAMS_SCORE",
  HANDICAP = "HANDICAP",
  CORRECT_SCORE = "CORRECT_SCORE",
  TOP_BATSMAN = "TOP_BATSMAN",
  TOP_BOWLER = "TOP_BOWLER",
}

export enum OddsType {
  BACK = "BACK",
  LAY = "LAY",
}

export enum MarketStatus {
  OPEN = "OPEN",
  SUSPENDED = "SUSPENDED",
  SETTLED = "SETTLED",
}

export interface SportResponse {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface LeagueResponse {
  id: string;
  sportId: string;
  name: string;
  country?: string;
  logo?: string;
}

export interface TeamResponse {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
}

export interface MatchResponse {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: TeamResponse;
  awayTeam: TeamResponse;
  league: LeagueResponse;
  startTime: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  markets: MarketResponse[];
}

export interface MarketResponse {
  id: string;
  matchId: string;
  name: string;
  type: MarketType;
  status: MarketStatus;
  odds: OddsResponse[];
}

export interface OddsResponse {
  id: string;
  marketId: string;
  label: string;
  type: OddsType;
  value: number;
  liquidity?: number;
  active: boolean;
}

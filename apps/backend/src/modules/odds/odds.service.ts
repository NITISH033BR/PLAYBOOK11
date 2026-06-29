import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { BettingService } from "../betting/betting.service";
import { SettlementService } from "../betting/settlement.service";

interface OddsAPIEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  completed?: boolean;
  scores?: OddsAPIScore[];
  bookmakers?: OddsAPIBookmaker[];
}

interface OddsAPIScore {
  name: string;
  score: string;
}

interface OddsAPIBookmaker {
  key: string;
  title: string;
  markets: OddsAPIMarket[];
}

interface OddsAPIMarket {
  key: string;
  last_update: string;
  outcomes: OddsAPIOutcome[];
}

interface OddsAPIOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsAPIScoresEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  completed: boolean;
  scores: OddsAPIScore[];
}

export interface NormalizedSport {
  key: string;
  title: string;
  active: boolean;
}

export interface NormalizedEvent {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  status: "upcoming" | "live" | "finished";
  homeScore?: number;
  awayScore?: number;
  bookmakers: NormalizedBookmaker[];
}

export interface NormalizedBookmaker {
  key: string;
  title: string;
  lastUpdate: string;
  markets: NormalizedMarket[];
}

export interface NormalizedMarket {
  key: string;
  name: string;
  lastUpdate: string;
  outcomes: NormalizedOutcome[];
}

export interface NormalizedOutcome {
  name: string;
  price: number;
  point?: number;
}

@Injectable()
export class OddsService {
  private readonly logger = new Logger(OddsService.name);
  private readonly apiKey: string;
  private readonly apiBase: string;

  private sportsCache: { data: NormalizedSport[]; timestamp: number } | null = null;
  private eventsCache: Map<string, { data: NormalizedEvent[]; timestamp: number }> = new Map();
  private allEventsCache: { data: NormalizedEvent[]; timestamp: number } | null = null;
  private readonly cacheTtlMs = 1_800_000; // 30 min — aggressive throttling to protect 500-credit limit
  private readonly settlementIntervalMs = 60_000;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private settlementInterval: ReturnType<typeof setInterval> | null = null;
  private apiUnavailable: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly bettingService: BettingService,
    private readonly settlementService: SettlementService,
  ) {
    this.apiKey = this.configService.get<string>("ODDS_API_KEY", "");
    this.apiBase = this.configService.get<string>("ODDS_API_BASE", "https://api.the-odds-api.com/v4");
    if (!this.apiKey) {
      this.logger.warn("ODDS_API_KEY not configured — odds integration disabled");
    }
  }

  onModuleInit() {
    if (this.apiKey) {
      setTimeout(() => this.refreshAll(), 1000);
      this.refreshInterval = setInterval(() => this.refreshAll(), this.cacheTtlMs);
      this.settlementInterval = setInterval(() => this.checkCompletedEvents(), this.settlementIntervalMs);
    }
  }

  onModuleDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.settlementInterval) {
      clearInterval(this.settlementInterval);
    }
  }

  private isCacheValid(cache: { timestamp: number } | null): boolean {
    if (!cache) return false;
    return Date.now() - cache.timestamp < this.cacheTtlMs;
  }

  private async fetchFromApi<T>(path: string, params: Record<string, string> = {}, retries = 2): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const url = new URL(`${this.apiBase}${path}`);
        url.searchParams.set("apiKey", this.apiKey);
        for (const [key, value] of Object.entries(params)) {
          url.searchParams.set(key, value);
        }

        const fullUrl = url.toString();
        this.logger.debug(`REQUEST URL: ${fullUrl}`);
        this.logger.debug(`API KEY being sent: "${this.apiKey}" (length: ${this.apiKey.length})`);

        const response = await fetch(fullUrl, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          const usageRemaining = response.headers.get("x-requests-remaining");
          if (response.status === 422) {
            this.logger.debug(`Odds API 422 for ${path}: no events available`);
            return [] as unknown as T;
          }
          this.logger.warn(
            `Odds API error: ${response.status} ${response.statusText}, remaining: ${usageRemaining}`,
          );
          if (response.status === 401) {
            const body = await response.text().catch(() => "unreadable");
            this.logger.warn(`Odds API 401 for ${path}: API key invalid or expired`);
            this.logger.warn(`Response body: ${body.substring(0, 500)}`);
            this.apiUnavailable = true;
            return [] as unknown as T;
          }
          if (response.status === 429) {
            if (attempt < retries) {
              const retryAfter = response.headers.get("retry-after");
              const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * (attempt + 1);
              this.logger.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
              await new Promise((r) => setTimeout(r, delay));
              continue;
            }
            throw new HttpException("Odds API rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
          }
          throw new HttpException(`Odds API error: ${response.statusText}`, HttpStatus.BAD_GATEWAY);
        }

        return response.json() as Promise<T>;
      } catch (error) {
        if (error instanceof HttpException) throw error;
        if (attempt < retries) {
          this.logger.warn(`Network error on attempt ${attempt + 1}/${retries}, retrying...`);
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        this.apiUnavailable = true;
        throw error;
      }
    }
    this.apiUnavailable = true;
    throw new HttpException("Odds API request failed after retries", HttpStatus.BAD_GATEWAY);
  }

  async getSports(refresh = false): Promise<NormalizedSport[]> {
    if (!refresh && this.isCacheValid(this.sportsCache)) {
      return this.sportsCache!.data;
    }

    try {
      const raw: { key: string; title: string; active: boolean }[] = await this.fetchFromApi("/sports");
      const normalized: NormalizedSport[] = raw
        .filter((s) => s.active)
        .map((s) => ({ key: s.key, title: s.title, active: s.active }));

      this.sportsCache = { data: normalized, timestamp: Date.now() };
      return normalized;
    } catch (error) {
      if (this.sportsCache) {
        this.logger.warn("Falling back to cached sports data");
        return this.sportsCache.data;
      }
      this.logger.warn("Falling back to local sports data from database");
      return this.getLocalSports();
    }
  }

  private async getLocalSports(): Promise<NormalizedSport[]> {
    try {
      const sports = await this.prisma.sport.findMany({ where: { active: true } });
      if (sports.length > 0) {
        return sports.map((s) => ({ key: s.slug.replace(/-/g, "_"), title: s.name, active: true }));
      }
    } catch { /* ignore */ }
    return [];
  }

  async getEvents(sportKey: string, refresh = false): Promise<NormalizedEvent[]> {
    const cacheKey = sportKey;
    const cached = this.eventsCache.get(cacheKey);

    if (!refresh && cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    try {
      const raw: (OddsAPIEvent & { completed?: boolean; scores?: OddsAPIScore[] })[] = await this.fetchFromApi(`/sports/${sportKey}/odds`, {
        regions: "us",
        markets: "h2h",
        oddsFormat: "decimal",
        dateFormat: "iso",
      });

      const normalized = this.normalizeEvents(raw, sportKey);
      this.eventsCache.set(cacheKey, { data: normalized, timestamp: Date.now() });
      return normalized;
    } catch (error) {
      if (cached) {
        this.logger.warn(`Falling back to cached events for ${sportKey}`);
        return cached.data;
      }
      throw error;
    }
  }

  async getAllLiveEvents(refresh = false): Promise<NormalizedEvent[]> {
    if (!refresh && this.isCacheValid(this.allEventsCache)) {
      return this.allEventsCache!.data;
    }

    // Testing: cricket-only polling to protect 500-credit limit
    const targetSports: NormalizedSport[] = [
      { key: "cricket_international_t20", title: "Cricket International T20", active: true },
      { key: "cricket_test_match", title: "Cricket Test Match", active: true },
      // Add more sports here when ready for full production
    ];

    const allEvents: NormalizedEvent[] = [];

    for (const sport of targetSports) {
      try {
        const events = await this.getEvents(sport.key, refresh);
        allEvents.push(...events);
        await new Promise((r) => setTimeout(r, 1100));
      } catch {
        await new Promise((r) => setTimeout(r, 1100));
      }
    }

    this.allEventsCache = { data: allEvents, timestamp: Date.now() };
    return allEvents;
  }

  async getEventById(eventId: string): Promise<NormalizedEvent | null> {
    const allEvents = await this.getAllLiveEvents();
    return allEvents.find((e) => e.id === eventId) || null;
  }

  private normalizeEvents(raw: (OddsAPIEvent & { completed?: boolean; scores?: OddsAPIScore[] })[], _sportKey: string): NormalizedEvent[] {
    const now = new Date();
    return raw.map((event) => {
      const startTime = new Date(event.commence_time);
      let status: NormalizedEvent["status"] = "upcoming";
      if (event.completed) {
        status = "finished";
      } else if (startTime <= now) {
        status = "live";
      }

      let homeScore: number | undefined;
      let awayScore: number | undefined;
      if (event.scores && event.scores.length >= 2) {
        const home = event.scores.find((s) =>
          s.name.toLowerCase() === event.home_team.toLowerCase(),
        ) || event.scores[0];
        const away = event.scores.find((s) =>
          s.name.toLowerCase() === event.away_team.toLowerCase(),
        ) || event.scores[1];
        if (home) homeScore = parseInt(home.score, 10) || 0;
        if (away) awayScore = parseInt(away.score, 10) || 0;
      }

      const bookmakers: NormalizedBookmaker[] = (event.bookmakers || []).map((bm) => ({
        key: bm.key,
        title: bm.title,
        lastUpdate: bm.markets?.[0]?.last_update || new Date().toISOString(),
        markets: (bm.markets || []).map((m) => ({
          key: m.key,
          name: this.marketKeyToName(m.key),
          lastUpdate: m.last_update,
          outcomes: m.outcomes.map((o) => ({
            name: o.name,
            price: o.price,
            point: o.point,
          })),
        })),
      }));

      return {
        id: event.id,
        sportKey: event.sport_key,
        sportTitle: event.sport_title,
        commenceTime: event.commence_time,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        status,
        homeScore,
        awayScore,
        bookmakers,
      };
    });
  }

  private async getLocalEvents(): Promise<NormalizedEvent[]> {
    try {
      const matches = await this.prisma.match.findMany({
        take: 50,
        orderBy: { startTime: "asc" },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: { include: { sport: true } },
          markets: { include: { odds: true } },
        },
      });

      return matches.map((m) => {
        const now = new Date();
        const startTime = new Date(m.startTime);
        let status: NormalizedEvent["status"] = "upcoming";
        if (m.status === "FINISHED") status = "finished";
        else if (m.status === "LIVE" || startTime <= now) status = "live";

        const apiKeyForType: Record<string, string> = {
          MATCH_ODDS: "h2h",
          HANDICAP: "spreads",
          OVER_UNDER: "totals",
        };
        const bookmakers: NormalizedBookmaker[] = [{
          key: "local",
          title: "Platform",
          lastUpdate: new Date().toISOString(),
          markets: m.markets.map((market) => ({
            key: apiKeyForType[market.type] || market.type?.toLowerCase() || "h2h",
            name: market.name,
            lastUpdate: new Date().toISOString(),
            outcomes: market.odds.map((odds) => ({
              name: odds.label,
              price: Number(odds.value),
              point: undefined,
            })),
          })),
        }];

        return {
          id: m.externalId || m.id,
          sportKey: m.league?.sport?.slug?.replace(/-/g, "_") || "unknown",
          sportTitle: m.league?.sport?.name || m.league?.name || "Unknown",
          commenceTime: m.startTime.toISOString(),
          homeTeam: m.homeTeam?.name || "Home",
          awayTeam: m.awayTeam?.name || "Away",
          status,
          homeScore: m.homeScore ?? undefined,
          awayScore: m.awayScore ?? undefined,
          bookmakers,
        };
      });
    } catch {
      return [];
    }
  }

  private marketKeyToName(key: string): string {
    const names: Record<string, string> = {
      h2h: "Match Winner",
      spreads: "Point Spread",
      totals: "Total Points",
    };
    return names[key] || key;
  }

  async placeLiveBet(
    userId: string,
    dto: { eventId: string; marketKey: string; outcomeName: string; odds: number; stake: number },
  ) {
    const allEvents = await this.getAllLiveEvents();
    const event = allEvents.find((e) => e.id === dto.eventId);
    if (!event) {
      throw new HttpException("Event not found or odds expired", HttpStatus.NOT_FOUND);
    }

    const oddsValid = event.bookmakers.some((bm) =>
      bm.markets.some((m) =>
        m.key === dto.marketKey &&
        m.outcomes.some((o) => o.name === dto.outcomeName && o.price === dto.odds),
      ),
    );

    if (!oddsValid) {
      throw new HttpException("Selected odds no longer available — refresh and try again", HttpStatus.CONFLICT);
    }

    const matchId = await this.findOrCreateMatch(event);
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { markets: { include: { odds: true } } },
    });
    if (!match) throw new HttpException("Failed to create match", HttpStatus.INTERNAL_SERVER_ERROR);

    const marketName = this.marketKeyToName(dto.marketKey);
    const activeMarket = match.markets.find((m) => m.name === marketName);
    if (!activeMarket) throw new HttpException("Market not found", HttpStatus.NOT_FOUND);

    const activeOdds = activeMarket.odds.find(
      (o) => o.label === dto.outcomeName && Number(o.value) === dto.odds,
    );
    if (!activeOdds) throw new HttpException("Odds not found", HttpStatus.NOT_FOUND);

    this.logger.log(`Placing live bet: user=${userId} event=${dto.eventId} market=${dto.marketKey} outcome=${dto.outcomeName}`);

    return this.bettingService.placeBet(userId, {
      stake: dto.stake,
      type: "SINGLE",
      legs: [{ marketId: activeMarket.id, oddsId: activeOdds.id }],
    });
  }

  async findOrCreateMatch(event: NormalizedEvent): Promise<string> {
    const existing = await this.prisma.match.findUnique({
      where: { externalId: event.id },
    });
    if (existing) {
      if (event.status === "finished" && existing.status !== "FINISHED") {
        await this.prisma.match.update({
          where: { id: existing.id },
          data: { status: "FINISHED" },
        });
      } else if (event.status === "live" && existing.status !== "LIVE") {
        await this.prisma.match.update({
          where: { id: existing.id },
          data: { status: "LIVE" },
        });
      }
      return existing.id;
    }

    const sportSlug = event.sportKey.replace(/_/g, "-");
    const sport = await this.prisma.sport.upsert({
      where: { slug: sportSlug },
      update: { name: event.sportTitle },
      create: { name: event.sportTitle, slug: sportSlug, active: true },
    });

    const shortName = (n: string) => n.replace(/[^a-zA-Z0-9 ]/g, "").trim().substring(0, 20);

    let homeTeam = await this.prisma.team.findFirst({
      where: { name: event.homeTeam, sportId: sport.id },
    });
    if (!homeTeam) {
      homeTeam = await this.prisma.team.create({
        data: { name: event.homeTeam, shortName: shortName(event.homeTeam), sportId: sport.id },
      });
    }

    let awayTeam = await this.prisma.team.findFirst({
      where: { name: event.awayTeam, sportId: sport.id },
    });
    if (!awayTeam) {
      awayTeam = await this.prisma.team.create({
        data: { name: event.awayTeam, shortName: shortName(event.awayTeam), sportId: sport.id },
      });
    }

    let league = await this.prisma.league.findFirst({
      where: { name: event.sportTitle, sportId: sport.id },
    });
    if (!league) {
      league = await this.prisma.league.create({
        data: { name: event.sportTitle, sportId: sport.id },
      });
    }

    const matchStatus = event.status === "live" ? "LIVE" : event.status === "finished" ? "FINISHED" : "SCHEDULED";
    const match = await this.prisma.match.create({
      data: {
        leagueId: league.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        externalId: event.id,
        externalSource: "the-odds-api",
        startTime: new Date(event.commenceTime),
        status: matchStatus,
        homeScore: event.homeScore,
        awayScore: event.awayScore,
      },
    });

    const marketTypeMap: Record<string, string> = {
      h2h: "MATCH_ODDS",
      spreads: "HANDICAP",
      totals: "OVER_UNDER",
    };

    const createdMarkets = new Map<string, string>();

    for (const bm of event.bookmakers) {
      for (const market of bm.markets) {
        const dbType = marketTypeMap[market.key] || "MATCH_ODDS";
        let dbMarketId = createdMarkets.get(market.key);

        if (!dbMarketId) {
          const dbMarket = await this.prisma.market.create({
            data: { matchId: match.id, name: this.marketKeyToName(market.key), type: dbType as any },
          });
          dbMarketId = dbMarket.id;
          createdMarkets.set(market.key, dbMarketId);
        }

        for (const outcome of market.outcomes) {
          const existingOdds = await this.prisma.odds.findFirst({
            where: { marketId: dbMarketId, label: outcome.name, active: true },
          });
          if (existingOdds && Number(existingOdds.value) === outcome.price) continue;
          if (existingOdds) {
            await this.prisma.odds.update({
              where: { id: existingOdds.id },
              data: { active: false },
            });
          }
          await this.prisma.odds.create({
            data: {
              marketId: dbMarketId,
              label: outcome.name,
              value: outcome.price,
              active: true,
            },
          });
        }
      }
    }

    this.logger.log(`Created match for external event: ${event.id} (${event.homeTeam} vs ${event.awayTeam})`);
    return match.id;
  }

  async getCompletedEvents(): Promise<OddsAPIScoresEvent[]> {
    // /scores endpoint disabled — API key lacks access.
    // Uncomment when key is upgraded or settlement via scores is needed.
    // const targetSports: NormalizedSport[] = [
    //   { key: "cricket_international_t20", title: "Cricket International T20", active: true },
    //   { key: "cricket_test_match", title: "Cricket Test Match", active: true },
    // ];
    // const completed: OddsAPIScoresEvent[] = [];
    // for (const sport of targetSports) {
    //   try {
    //     const raw: OddsAPIScoresEvent[] = await this.fetchFromApi(`/sports/${sport.key}/scores`, {
    //       daysFrom: "3",
    //     });
    //     completed.push(...raw.filter((e) => e.completed));
    //     await new Promise((r) => setTimeout(r, 1100));
    //   } catch {
    //     await new Promise((r) => setTimeout(r, 1100));
    //   }
    // }
    // return completed;
    return [];
  }

  async checkCompletedEvents() {
    try {
      const completed = await this.getCompletedEvents();
      for (const event of completed) {
        await this.settleMatchFromScores(event);
      }
    } catch (error) {
      this.logger.warn("Settlement check failed", error instanceof Error ? error.message : error);
    }
  }

  private async settleMatchFromScores(event: OddsAPIScoresEvent) {
    const match = await this.prisma.match.findUnique({
      where: { externalId: event.id },
      include: { markets: { include: { odds: true } } },
    });
    if (!match) return;

    if (match.status === "FINISHED" && !event.scores?.length) return;

    const isAlreadySettled = match.markets.every((m) => m.status === "SETTLED");
    if (isAlreadySettled) return;

    const homeScore = event.scores?.find((s) =>
      s.name.toLowerCase() === event.home_team.toLowerCase(),
    )?.score;
    const awayScore = event.scores?.find((s) =>
      s.name.toLowerCase() === event.away_team.toLowerCase(),
    )?.score;
    if (homeScore === undefined || awayScore === undefined) return;

    const hHome = parseInt(homeScore, 10);
    const hAway = parseInt(awayScore, 10);

    await this.prisma.match.update({
      where: { id: match.id },
      data: { status: "FINISHED", homeScore: hHome, awayScore: hAway },
    });

    for (const market of match.markets) {
      if (market.status === "SETTLED") continue;

      let winningOddsId: string | null = null;

      if (market.type === "MATCH_ODDS") {
        const winner = hHome > hAway ? event.home_team : hAway > hHome ? event.away_team : null;
        if (winner) {
          const winningOdds = market.odds.find((o) => o.label === winner);
          if (winningOdds) winningOddsId = winningOdds.id;
        }
      } else if (market.type === "HANDICAP") {
        for (const oddsRecord of market.odds) {
          const label = oddsRecord.label;
          const pointMatch = label.match(/[-+]?\d+\.?\d*/);
          if (pointMatch) {
            const spread = parseFloat(pointMatch[0]);
            const isHomeLabel = label.toLowerCase().includes(event.home_team.toLowerCase());
            const adjustedHome = isHomeLabel ? hHome + spread : hHome;
            const adjustedAway = isHomeLabel ? hAway : hAway - spread;
            if (adjustedHome > adjustedAway) {
              winningOddsId = oddsRecord.id;
              break;
            }
          }
        }
      } else if (market.type === "OVER_UNDER") {
        const totalPoints = hHome + hAway;
        for (const oddsRecord of market.odds) {
          const label = (oddsRecord.label || "").toLowerCase();
          const pointMatch = label.match(/[0-9]+\.?[0-9]*/);
          if (pointMatch) {
            const line = parseFloat(pointMatch[0]);
            if (label.includes("over") && totalPoints > line) {
              winningOddsId = oddsRecord.id;
            } else if (label.includes("under") && totalPoints < line) {
              winningOddsId = oddsRecord.id;
            }
          }
        }
      }

      if (winningOddsId) {
        await this.settlementService.settleMarket(market.id, winningOddsId);
      }
    }

    this.logger.log(`Auto-settled match: ${event.id} (${event.home_team} vs ${event.away_team})`);
  }

  private async refreshAll() {
    if (this.apiUnavailable) return;
    try {
      await this.getSports(true);
      await this.getAllLiveEvents(true);
    } catch (error) {
      this.logger.error("Failed to refresh caches", error instanceof Error ? error.message : error);
    }
  }
}

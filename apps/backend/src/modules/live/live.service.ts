import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class LiveService {
  private readonly logger = new Logger(LiveService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMatchUpdate(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: { include: { sport: true } },
        markets: {
          include: { odds: { where: { active: true } } },
          orderBy: { type: "asc" },
        },
      },
    });

    if (!match) return null;

    return {
      id: match.id,
      status: match.status,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeWickets: match.homeWickets,
      awayWickets: match.awayWickets,
      homeOvers: match.homeOvers ? Number(match.homeOvers) : null,
      awayOvers: match.awayOvers ? Number(match.awayOvers) : null,
      innings: match.innings,
      battingTeam: match.battingTeam,
      bowlingTeam: match.bowlingTeam,
      currentRr: match.currentRr ? Number(match.currentRr) : null,
      requiredRr: match.requiredRr ? Number(match.requiredRr) : null,
      lastWicket: match.lastWicket,
      currentOver: match.currentOver,
      batsmen: match.batsmen,
      bowler: match.bowler,
      partnership: match.partnership,
      commentary: match.commentary,
      events: match.events,
      markets: match.markets.map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        status: m.status,
        odds: m.odds.map((o) => ({
          id: o.id,
          label: o.label,
          type: o.type,
          value: Number(o.value),
          liquidity: o.liquidity ? Number(o.liquidity) : 0,
          active: o.active,
        })),
      })),
    };
  }

  async getAllLiveMatches() {
    return this.prisma.match.findMany({
      where: { status: "LIVE" },
      select: { id: true },
    });
  }
}

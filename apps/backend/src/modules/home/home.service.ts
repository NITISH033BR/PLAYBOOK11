import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTrendingBets(limit = 8) {
    const bets = await this.prisma.bet.findMany({
      where: { status: "PENDING" },
      include: {
        legs: {
          include: {
            market: { include: { match: { include: { homeTeam: true, awayTeam: true } } } },
            odds: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return bets.map((bet) => ({
      id: bet.id,
      matchName: bet.legs[0]?.market?.match
        ? `${bet.legs[0].market.match.homeTeam?.shortName || bet.legs[0].market.match.homeTeam?.name} vs ${bet.legs[0].market.match.awayTeam?.shortName || bet.legs[0].market.match.awayTeam?.name}`
        : "Unknown",
      marketName: bet.legs[0]?.market?.name || "Unknown",
      selection: bet.legs[0]?.odds?.label || "Unknown",
      odds: Number(bet.legs[0]?.oddsValue || 0),
      stake: Number(bet.stake),
      potentialWin: Number(bet.potentialWin),
      matchId: bet.legs[0]?.market?.matchId || "",
    }));
  }

  async getFeaturedMarkets(limit = 6) {
    const liveMatches = await this.prisma.match.findMany({
      where: { status: "LIVE" },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: { include: { sport: true } },
        markets: {
          where: { status: "OPEN" },
          include: { odds: { where: { active: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return liveMatches.flatMap((match) =>
      match.markets.slice(0, 2).map((market) => ({
        id: market.id,
        marketName: market.name,
        type: market.type,
        matchId: match.id,
        matchName: `${match.homeTeam?.shortName || match.homeTeam?.name} vs ${match.awayTeam?.shortName || match.awayTeam?.name}`,
        league: match.league?.name,
        sport: match.league?.sport?.name,
        odds: market.odds.map((o) => ({
          id: o.id,
          label: o.label,
          type: o.type,
          value: Number(o.value),
          liquidity: Number(o.liquidity),
        })),
      }))
    );
  }

  async getRecentWinners(limit = 10) {
    const bets = await this.prisma.bet.findMany({
      where: { status: "WON" },
      include: {
        user: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { settledAt: "desc" },
      take: limit,
    });

    return bets.map((bet) => ({
      id: bet.id,
      username: bet.user.displayName || bet.user.username,
      amount: Number(bet.potentialWin),
      stake: Number(bet.stake),
      settledAt: bet.settledAt,
    }));
  }

  async getHomeSummary() {
    const [liveCount, upcomingCount, sportCount, totalUsers, activeBets] = await Promise.all([
      this.prisma.match.count({ where: { status: "LIVE" } }),
      this.prisma.match.count({ where: { status: "SCHEDULED", startTime: { gte: new Date() } } }),
      this.prisma.sport.count({ where: { active: true } }),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.bet.count({ where: { status: "PENDING" } }),
    ]);

    return { liveCount, upcomingCount, sportCount, totalUsers, activeBets };
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PaginationDto } from "../../common/dto/pagination.dto";

function addCountdown(match: any) {
  const now = new Date().getTime();
  const start = new Date(match.startTime).getTime();
  return {
    ...match,
    countdown: Math.max(0, start - now),
    toss: match.battingTeam
      ? { winner: match.battingTeam, decision: "Bat" }
      : null,
    lastWicket: match.lastWicket,
    currentOver: match.currentOver,
    commentary: match.commentary,
    events: match.events,
  };
}

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.match.findMany({
        include: {
          homeTeam: true,
          awayTeam: true,
          league: { include: { sport: true } },
          markets: {
            include: { odds: { where: { active: true } } },
          },
        },
        orderBy: { startTime: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.match.count(),
    ]);

    return {
      data: data.map(addCountdown),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLive() {
    const data = await this.prisma.match.findMany({
      where: { status: "LIVE" },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: { include: { sport: true } },
        markets: {
          include: { odds: { where: { active: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return data.map(addCountdown);
  }

  async getUpcoming(pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.match.findMany({
        where: {
          status: "SCHEDULED",
          startTime: { gte: new Date() },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: { include: { sport: true } },
          markets: {
            include: { odds: { where: { active: true } } },
          },
        },
        orderBy: { startTime: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.match.count({
        where: {
          status: "SCHEDULED",
          startTime: { gte: new Date() },
        },
      }),
    ]);

    return {
      data: data.map(addCountdown),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
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

    if (!match) {
      throw new NotFoundException("Match not found");
    }

    return addCountdown(match);
  }
}

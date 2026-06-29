import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SportsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sport.findMany({
      where: { active: true },
      include: {
        _count: { select: { leagues: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async findBySlug(slug: string) {
    const sport = await this.prisma.sport.findUnique({
      where: { slug },
      include: {
        leagues: {
          include: {
            _count: { select: { matches: true } },
          },
        },
      },
    });

    if (!sport) {
      throw new NotFoundException("Sport not found");
    }

    return sport;
  }

  async getLeagues(slug: string) {
    const sport = await this.prisma.sport.findUnique({ where: { slug } });
    if (!sport) {
      throw new NotFoundException("Sport not found");
    }

    return this.prisma.league.findMany({
      where: { sportId: sport.id },
      include: {
        _count: { select: { matches: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async getMatches(slug: string) {
    const sport = await this.prisma.sport.findUnique({ where: { slug } });
    if (!sport) {
      throw new NotFoundException("Sport not found");
    }

    return this.prisma.match.findMany({
      where: {
        league: { sportId: sport.id },
        status: { in: ["SCHEDULED", "LIVE"] },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        markets: {
          include: { odds: { where: { active: true } } },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }
}

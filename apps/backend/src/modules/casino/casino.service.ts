import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CasinoService {
  private readonly logger = new Logger(CasinoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    return this.prisma.casinoCategory.findMany({
      where: { active: true },
      include: { _count: { select: { games: true } } },
      orderBy: { sortOrder: "asc" },
    });
  }

  async getGames(filters: {
    categorySlug?: string;
    featured?: boolean;
    popular?: boolean;
    search?: string;
    limit?: number;
  }) {
    const where: any = { active: true };

    if (filters.categorySlug) {
      const category = await this.prisma.casinoCategory.findUnique({
        where: { slug: filters.categorySlug },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    if (filters.featured) where.featured = true;
    if (filters.popular) where.popular = true;

    if (filters.search) {
      where.name = { contains: filters.search, mode: "insensitive" };
    }

    return this.prisma.casinoGame.findMany({
      where,
      include: {
        provider: { select: { id: true, name: true, logo: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: filters.limit || 50,
    });
  }

  async getGameBySlug(slug: string) {
    const game = await this.prisma.casinoGame.findUnique({
      where: { slug },
      include: {
        provider: { select: { id: true, name: true, logo: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
      },
    });

    if (!game) throw new NotFoundException("Game not found");
    return game;
  }

  async getPromotions() {
    return this.prisma.casinoPromotion.findMany({
      where: {
        active: true,
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async getFeatured(limit = 8) {
    return this.prisma.casinoGame.findMany({
      where: { active: true, featured: true },
      include: {
        provider: { select: { id: true, name: true, logo: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
      },
      orderBy: { sortOrder: "asc" },
      take: limit,
    });
  }

  async getRecentWinners(limit = 10) {
    const sessions = await this.prisma.casinoSession.findMany({
      where: { winAmount: { gt: 0 }, status: "WON" },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, username: true, displayName: true } },
        game: { select: { name: true, slug: true } },
      },
    });
    return sessions.map((s) => ({
      id: s.id,
      username: s.user.displayName || s.user.username,
      amount: Number(s.winAmount),
      gameName: s.game.name,
      gameSlug: s.game.slug,
      settledAt: s.updatedAt,
    }));
  }

  async getTrendingGames(limit = 8) {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const sessions = await this.prisma.casinoSession.groupBy({
      by: ["gameSlug"],
      where: { createdAt: { gte: thirtyMinsAgo } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });
    const slugs = sessions.map((s) => s.gameSlug);
    if (slugs.length === 0) {
      return this.getFeatured(limit);
    }
    const games = await this.prisma.casinoGame.findMany({
      where: { slug: { in: slugs }, active: true },
      include: {
        provider: { select: { id: true, name: true, logo: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
      },
    });
    return slugs.map((slug) => games.find((g) => g.slug === slug)).filter(Boolean);
  }

  async getNewReleases(limit = 8) {
    return this.prisma.casinoGame.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        provider: { select: { id: true, name: true, logo: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
      },
    });
  }

  async getRecentlyPlayed(userId: string, limit = 8) {
    const sessions = await this.prisma.casinoSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit * 2,
      distinct: ["gameSlug"],
      select: { gameSlug: true },
    });
    const slugs = [...new Set(sessions.map((s) => s.gameSlug))].slice(0, limit);
    if (slugs.length === 0) return [];
    return this.prisma.casinoGame.findMany({
      where: { slug: { in: slugs }, active: true },
      include: {
        provider: { select: { id: true, name: true, logo: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
      },
    });
  }

  async getLeaderboard(limit = 10, period = "all") {
    const dateFilter: any = {};
    if (period === "24h") dateFilter.gte = new Date(Date.now() - 24 * 60 * 60 * 1000);
    else if (period === "7d") dateFilter.gte = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (period === "30d") dateFilter.gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where: any = { winAmount: { gt: 0 }, status: "WON" };
    if (dateFilter.gte) where.createdAt = dateFilter;

    const leaderboard = await this.prisma.casinoSession.groupBy({
      by: ["userId"],
      where,
      _sum: { winAmount: true },
      _count: { id: true },
      orderBy: { _sum: { winAmount: "desc" } },
      take: limit,
    });

    const userIds = leaderboard.map((e) => e.userId);
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, displayName: true },
        })
      : [];

    return leaderboard.map((entry, i) => {
      const user = users.find((u) => u.id === entry.userId);
      return {
        rank: i + 1,
        userId: entry.userId,
        username: user?.displayName || user?.username || "Unknown",
        totalWinnings: Number(entry._sum.winAmount) || 0,
        totalWins: entry._count.id,
      };
    });
  }

  async getStats() {
    const [totalGames, totalCategories, totalSessions, activePlayers] = await Promise.all([
      this.prisma.casinoGame.count({ where: { active: true } }),
      this.prisma.casinoCategory.count({ where: { active: true } }),
      this.prisma.casinoSession.count(),
      this.prisma.casinoSession.groupBy({ by: ["userId"], _count: { id: true } }).then((r) => r.length),
    ]);
    return { totalGames, totalCategories, totalSessions, activePlayers };
  }
}

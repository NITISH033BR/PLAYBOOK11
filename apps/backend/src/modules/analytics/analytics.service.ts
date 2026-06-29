import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      totalUsers,
      totalBets,
      settledBets,
      totalDeposits,
      totalWithdrawals,
      revenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.bet.count(),
      this.prisma.bet.count({
        where: { status: { in: ["WON", "LOST"] } },
      }),
      this.prisma.transaction.aggregate({
        where: { type: "DEPOSIT", status: "COMPLETED" },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { type: "WITHDRAWAL", status: "COMPLETED" },
        _sum: { amount: true },
      }),
      this.calculateRevenue(),
    ]);

    return {
      totalUsers,
      totalBets,
      settledBets,
      pendingBets: totalBets - settledBets,
      totalDeposits: totalDeposits._sum.amount || 0,
      totalWithdrawals: totalWithdrawals._sum.amount || 0,
      revenue,
    };
  }

  async getRevenue() {
    const [totalStakes, totalPayouts] = await Promise.all([
      this.prisma.bet.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { stake: true },
      }),
      this.prisma.bet.aggregate({
        where: { status: "WON" },
        _sum: { potentialWin: true },
      }),
    ]);

    const stakes = Number(totalStakes._sum.stake || 0);
    const payouts = Number(totalPayouts._sum.potentialWin || 0);

    return {
      totalStakes: stakes,
      totalPayouts: payouts,
      grossRevenue: stakes - payouts,
      margin: stakes > 0 ? ((stakes - payouts) / stakes) * 100 : 0,
    };
  }

  async getUserAnalytics() {
    const [totalUsers, usersByRole] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({
        by: ["role"],
        _count: true,
      }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const raw = (await this.prisma.$queryRawUnsafe(
      `SELECT DATE(created_at) as date, COUNT(*)::int as count
       FROM users
       WHERE created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      thirtyDaysAgo,
    )) as { date: string; count: number }[];
    const recentRegistrations = raw.map((r: { date: string; count: number }) => ({
      createdAt: r.date,
      _count: Number(r.count),
    }));

    return {
      totalUsers,
      usersByRole,
      recentRegistrations,
    };
  }

  async getBetAnalytics() {
    const [totalBets, betsByStatus, betsByType] = await Promise.all([
      this.prisma.bet.count(),
      this.prisma.bet.groupBy({
        by: ["status"],
        _count: true,
        _sum: { stake: true, potentialWin: true },
      }),
      this.prisma.bet.groupBy({
        by: ["type"],
        _count: true,
      }),
    ]);

    return {
      totalBets,
      betsByStatus,
      betsByType,
    };
  }

  private async calculateRevenue() {
    const [stakes, payouts] = await Promise.all([
      this.prisma.bet.aggregate({
        _sum: { stake: true },
      }),
      this.prisma.bet.aggregate({
        where: { status: "WON" },
        _sum: { potentialWin: true },
      }),
    ]);

    return Number(stakes._sum.stake || 0) - Number(payouts._sum.potentialWin || 0);
  }
}

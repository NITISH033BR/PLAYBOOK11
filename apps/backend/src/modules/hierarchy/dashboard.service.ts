import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ExposureService } from "./exposure.service";

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exposureService: ExposureService,
  ) {}

  async getAdminDashboard() {
    const [mastersCount, agentsCount, playersCount, totalDeposits, totalWithdrawals] =
      await Promise.all([
        this.prisma.user.count({ where: { role: "MASTER_ID" } }),
        this.prisma.user.count({ where: { role: "AGENT" } }),
        this.prisma.user.count({ where: { role: "USER" } }),
        this.prisma.transaction.aggregate({
          where: { type: "DEPOSIT", status: "COMPLETED" },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { type: "WITHDRAWAL", status: "COMPLETED" },
          _sum: { amount: true },
        }),
      ]);

    const totalExposure = await this.exposureService.getExposureByRole("", "SUPER_ADMIN");

    const totalWon = await this.prisma.bet.aggregate({
      where: { status: "WON" },
      _sum: { potentialWin: true },
    });

    const totalLost = await this.prisma.bet.aggregate({
      where: { status: "LOST" },
      _sum: { stake: true },
    });

    const totalPnL = Number(totalWon._sum.potentialWin || 0) - Number(totalLost._sum.stake || 0);

    return {
      mastersCount,
      agentsCount,
      playersCount,
      totalExposure,
      totalDeposits: Number(totalDeposits._sum.amount || 0),
      totalWithdrawals: Number(totalWithdrawals._sum.amount || 0),
      totalPnL,
    };
  }

  async getMasterDashboard(masterUserId: string) {
    const masterHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: masterUserId },
      select: { id: true },
    });

    if (!masterHierarchy) {
      return this.emptyDashboard();
    }

    const agentHierarchies = await this.prisma.userHierarchy.findMany({
      where: { parentId: masterHierarchy.id },
      select: { id: true, userId: true },
    });

    const agentIds = agentHierarchies.map((a) => a.userId);
    const agentHierarchyIds = agentHierarchies.map((a) => a.id);

    const playerHierarchies = agentHierarchyIds.length > 0
      ? await this.prisma.userHierarchy.findMany({
          where: { parentId: { in: agentHierarchyIds } },
          select: { userId: true },
        })
      : [];

    const playerIds = playerHierarchies.map((p) => p.userId);

    const [agentsCount, playersCount, totalDeposits, totalWithdrawals] = await Promise.all([
      Promise.resolve(agentIds.length),
      Promise.resolve(playerIds.length),
      playerIds.length > 0
        ? this.prisma.transaction.aggregate({
            where: { userId: { in: playerIds }, type: "DEPOSIT", status: "COMPLETED" },
            _sum: { amount: true },
          })
        : { _sum: { amount: 0 } },
      playerIds.length > 0
        ? this.prisma.transaction.aggregate({
            where: { userId: { in: playerIds }, type: "WITHDRAWAL", status: "COMPLETED" },
            _sum: { amount: true },
          })
        : { _sum: { amount: 0 } },
    ]);

    const ownExposure = await this.exposureService.getMasterExposure(masterUserId);

    const totalWon = playerIds.length > 0
      ? await this.prisma.bet.aggregate({
          where: { userId: { in: playerIds }, status: "WON" },
          _sum: { potentialWin: true },
        })
      : { _sum: { potentialWin: 0 } };

    const totalLost = playerIds.length > 0
      ? await this.prisma.bet.aggregate({
          where: { userId: { in: playerIds }, status: "LOST" },
          _sum: { stake: true },
        })
      : { _sum: { stake: 0 } };

    const totalPnL = Number(totalWon._sum.potentialWin || 0) - Number(totalLost._sum.stake || 0);

    return {
      agentsCount,
      playersCount,
      ownExposure,
      totalDeposits: Number(totalDeposits._sum.amount || 0),
      totalWithdrawals: Number(totalWithdrawals._sum.amount || 0),
      totalPnL,
    };
  }

  async getAgentDashboard(agentUserId: string) {
    const agentHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: agentUserId },
      select: { id: true },
    });

    if (!agentHierarchy) {
      return this.emptyAgentDashboard();
    }

    const playerHierarchies = await this.prisma.userHierarchy.findMany({
      where: { parentId: agentHierarchy.id },
      select: { userId: true },
    });

    const playerIds = playerHierarchies.map((p) => p.userId);

    const [playersCount, totalDeposits, totalWithdrawals] = await Promise.all([
      Promise.resolve(playerIds.length),
      playerIds.length > 0
        ? this.prisma.transaction.aggregate({
            where: { userId: { in: playerIds }, type: "DEPOSIT", status: "COMPLETED" },
            _sum: { amount: true },
          })
        : { _sum: { amount: 0 } },
      playerIds.length > 0
        ? this.prisma.transaction.aggregate({
            where: { userId: { in: playerIds }, type: "WITHDRAWAL", status: "COMPLETED" },
            _sum: { amount: true },
          })
        : { _sum: { amount: 0 } },
    ]);

    const ownExposure = await this.exposureService.getAgentExposure(agentUserId);

    const totalWon = playerIds.length > 0
      ? await this.prisma.bet.aggregate({
          where: { userId: { in: playerIds }, status: "WON" },
          _sum: { potentialWin: true },
        })
      : { _sum: { potentialWin: 0 } };

    const totalLost = playerIds.length > 0
      ? await this.prisma.bet.aggregate({
          where: { userId: { in: playerIds }, status: "LOST" },
          _sum: { stake: true },
        })
      : { _sum: { stake: 0 } };

    const totalPnL = Number(totalWon._sum.potentialWin || 0) - Number(totalLost._sum.stake || 0);

    return {
      playersCount,
      ownExposure,
      totalDeposits: Number(totalDeposits._sum.amount || 0),
      totalWithdrawals: Number(totalWithdrawals._sum.amount || 0),
      totalPnL,
    };
  }

  async getPlayerDashboard(playerUserId: string) {
    const [wallet, exposure, recentBets, recentTransactions] = await Promise.all([
      this.prisma.wallet.findUnique({ where: { userId: playerUserId } }),
      this.exposureService.getPlayerExposure(playerUserId),
      this.prisma.bet.findMany({
        where: { userId: playerUserId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          stake: true,
          totalOdds: true,
          potentialWin: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.transaction.findMany({
        where: { userId: playerUserId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      balance: wallet ? Number(wallet.balance) : 0,
      bonus: wallet ? Number(wallet.bonus) : 0,
      locked: wallet ? Number(wallet.locked) : 0,
      exposure,
      recentBets,
      recentTransactions,
    };
  }

  private emptyDashboard() {
    return {
      agentsCount: 0,
      playersCount: 0,
      ownExposure: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalPnL: 0,
    };
  }

  private emptyAgentDashboard() {
    return {
      playersCount: 0,
      ownExposure: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalPnL: 0,
    };
  }
}

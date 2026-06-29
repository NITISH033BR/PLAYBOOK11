import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ExposureService {
  private readonly logger = new Logger(ExposureService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPlayerExposure(userId: string): Promise<number> {
    const result = await this.prisma.bet.aggregate({
      where: {
        userId,
        status: "PENDING",
      },
      _sum: { stake: true },
    });

    return Number(result._sum.stake || 0);
  }

  async getAgentExposure(agentUserId: string): Promise<number> {
    const agentHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: agentUserId },
      select: { id: true },
    });

    if (!agentHierarchy) return 0;

    const playerHierarchies = await this.prisma.userHierarchy.findMany({
      where: { parentId: agentHierarchy.id },
      select: { userId: true },
    });

    if (playerHierarchies.length === 0) return 0;

    const playerIds = playerHierarchies.map((h) => h.userId);

    const result = await this.prisma.bet.aggregate({
      where: {
        userId: { in: playerIds },
        status: "PENDING",
      },
      _sum: { stake: true },
    });

    return Number(result._sum.stake || 0);
  }

  async getMasterExposure(masterUserId: string): Promise<number> {
    const masterHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: masterUserId },
      select: { id: true },
    });

    if (!masterHierarchy) return 0;

    const agentHierarchies = await this.prisma.userHierarchy.findMany({
      where: { parentId: masterHierarchy.id },
      select: { id: true, userId: true },
    });

    if (agentHierarchies.length === 0) return 0;

    const agentIds = agentHierarchies.map((h) => h.id);

    const playerHierarchies = await this.prisma.userHierarchy.findMany({
      where: { parentId: { in: agentIds } },
      select: { userId: true },
    });

    if (playerHierarchies.length === 0) return 0;

    const playerIds = playerHierarchies.map((h) => h.userId);

    const result = await this.prisma.bet.aggregate({
      where: {
        userId: { in: playerIds },
        status: "PENDING",
      },
      _sum: { stake: true },
    });

    return Number(result._sum.stake || 0);
  }

  async getExposureByRole(userId: string, role: string): Promise<number> {
    switch (role) {
      case "USER":
        return this.getPlayerExposure(userId);
      case "AGENT":
        return this.getAgentExposure(userId);
      case "MASTER_ID":
        return this.getMasterExposure(userId);
      case "ADMIN":
      case "SUPER_ADMIN": {
        const result = await this.prisma.bet.aggregate({
          where: { status: "PENDING" },
          _sum: { stake: true },
        });
        return Number(result._sum.stake || 0);
      }
      default:
        return 0;
    }
  }
}

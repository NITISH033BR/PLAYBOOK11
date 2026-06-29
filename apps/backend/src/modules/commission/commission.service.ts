import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CommissionService {
  /**
   * Commission distribution rules:
   * - Base = stake (on loss) or profit (on win) = potentialWin - stake
   * - Compounding model: each upstream level takes rate% of the remaining base
   *   e.g. Agent 20% of 100 = 20, Master 10% of 80 = 8, Total = 28
   * - NOT parallel: not agent 20 + master 10 = 30
   * - Stops at LEVEL_1_ADMIN (no commission to super admin)
   * - Players never receive commission (they are the source)
   * - 0% rate skips the level entirely
   */
  private readonly logger = new Logger(CommissionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async distributeBetCommission(betId: string) {
    await this.prisma.$transaction(async (tx: any) => {
      await this.distributeBetCommissionInTx(tx, betId);
    });
  }

  async distributeBetCommissionInTx(tx: any, betId: string) {
    const bet = await tx.bet.findUnique({
      where: { id: betId },
      include: { user: { include: { hierarchy: true } } },
    });

    if (!bet || !bet.user.hierarchy) return;

    const playerHierarchy = bet.user.hierarchy;
    if (playerHierarchy.level !== "LEVEL_4_PLAYER") return;

    const isWin = bet.status === "WON";
    const isLoss = bet.status === "LOST";
    if (!isWin && !isLoss) return;

    const baseAmount = isLoss
      ? Number(bet.stake)
      : Math.max(0, Number(bet.potentialWin) - Number(bet.stake));

    if (baseAmount <= 0) return;

    const hierarchyChain = await this.buildUpwardChain(tx, playerHierarchy.parentId);

    let remainingAmount = baseAmount;

    for (const node of hierarchyChain) {
      const rate = Number(node.commissionRate || 0);
      if (rate <= 0) continue;

      const commissionAmount = Math.round((remainingAmount * rate) / 100 * 100) / 100;
      if (commissionAmount <= 0) continue;

      const wallet = await tx.wallet.findUnique({ where: { userId: node.userId } });
      if (!wallet) continue;

      await tx.wallet.update({
        where: { id: wallet.id, version: wallet.version },
        data: {
          balance: { increment: commissionAmount },
          version: { increment: 1 },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: node.userId,
          type: "COMMISSION",
          amount: commissionAmount,
          balanceBefore: wallet.balance,
          balanceAfter: Number(wallet.balance) + commissionAmount,
          status: "COMPLETED",
          description: `Commission from bet ${betId} (${isWin ? "win" : "loss"})`,
        },
      });

      await tx.commission.create({
        data: {
          fromUserId: bet.userId,
          toUserId: node.userId,
          betId,
          type: isWin ? "BET_WON" : "BET_PLACED",
          amount: commissionAmount,
          rate,
        },
      });

      await tx.commissionTransaction.create({
        data: {
          receiverId: node.id,
          sourceBetId: betId,
          amount: commissionAmount,
          rate,
          level: node.level as any,
        },
      });

      remainingAmount -= commissionAmount;
      this.logger.log(`Commission: ${node.userId} received ${commissionAmount} from bet ${betId}`);
    }
  }

  private async buildUpwardChain(
    tx: any,
    startHierarchyId: string | null,
  ): Promise<{ id: string; userId: string; level: string; commissionRate: number }[]> {
    const chain: { id: string; userId: string; level: string; commissionRate: number }[] = [];

    let currentId = startHierarchyId;
    while (currentId) {
      const node = await tx.userHierarchy.findUnique({
        where: { id: currentId },
        select: { id: true, userId: true, level: true, commissionRate: true, parentId: true },
      });

      if (!node) break;

      if (node.level === "LEVEL_1_ADMIN") break;

      chain.push({
        id: node.id,
        userId: node.userId,
        level: node.level,
        commissionRate: Number(node.commissionRate || 0),
      });

      currentId = node.parentId;
    }

    return chain;
  }
}

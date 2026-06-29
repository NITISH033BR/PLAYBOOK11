import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CommissionService } from "../commission/commission.service";

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionService: CommissionService,
  ) {}

  async settleMarket(marketId: string, winningOddsId: string) {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
      include: { odds: true },
    });

    if (!market || market.status === "SETTLED") {
      return;
    }

    await this.prisma.$transaction(async (tx: any) => {
      await tx.market.update({
        where: { id: marketId },
        data: { status: "SETTLED" },
      });

      const betLegs = await tx.betLeg.findMany({
        where: { marketId },
        include: { bet: true },
      });

      for (const leg of betLegs) {
        const won = leg.oddsId === winningOddsId;
        await tx.betLeg.update({
          where: { id: leg.id },
          data: {
            status: won ? "WON" : "LOST",
            settledAt: new Date(),
          },
        });
      }

      const betIds = [...new Set(betLegs.map((l: any) => l.betId))];
      for (const betId of betIds as string[]) {
        await this.trySettleBet(tx, betId);
        await this.commissionService.distributeBetCommissionInTx(tx, betId);
      }
    });

    this.logger.log(`Market settled: ${marketId}`);
  }

  private async trySettleBet(tx: any, betId: string) {
    const bet = await tx.bet.findUnique({
      where: { id: betId },
      include: { legs: true },
    });

    if (!bet) return;

    const allSettled = bet.legs.every((l: any) => l.status !== "PENDING");
    if (!allSettled) return;

    if (bet.type === "SINGLE") {
      const leg = bet.legs[0];
      if (leg.status === "WON") {
        await this.payoutBet(tx, bet);
      } else {
        await this.releaseStake(tx, bet);
      }
    } else {
      const hasLost = bet.legs.some((l: any) => l.status === "LOST");
      const allWon = bet.legs.every((l: any) => l.status === "WON");

      if (allWon) {
        await this.payoutBet(tx, bet);
      } else if (hasLost) {
        await this.releaseStake(tx, bet);
      }
    }
  }

  private async payoutBet(tx: any, bet: any) {
    const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
    if (!wallet) return;

    const stake = Number(bet.stake);
    const winAmount = Number(bet.potentialWin);
    const profit = winAmount - stake;
    const newBalance = Number(wallet.balance) + profit;
    const newLocked = Number(wallet.locked) - stake;

    await tx.wallet.update({
      where: { id: wallet.id, version: wallet.version },
      data: {
        balance: newBalance,
        locked: newLocked,
        version: { increment: 1 },
      },
    });

    await tx.bet.update({
      where: { id: bet.id },
      data: { status: "WON", settledAt: new Date() },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId: bet.userId,
        type: "BET_WON",
        amount: winAmount,
        balanceBefore: wallet.balance,
        balanceAfter: newBalance,
        status: "COMPLETED",
        description: `Bet won: ${bet.id} payout=${winAmount}`,
      },
    });
  }

  private async releaseStake(tx: any, bet: any) {
    const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
    if (!wallet) return;

    const stake = Number(bet.stake);
    const newBalance = Number(wallet.balance) - stake;
    const newLocked = Number(wallet.locked) - stake;

    await tx.wallet.update({
      where: { id: wallet.id, version: wallet.version },
      data: {
        balance: newBalance,
        locked: newLocked,
        version: { increment: 1 },
      },
    });

    await tx.bet.update({
      where: { id: bet.id },
      data: { status: "LOST", settledAt: new Date() },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId: bet.userId,
        type: "BET_LOST",
        amount: bet.stake,
        balanceBefore: wallet.balance,
        balanceAfter: newBalance,
        status: "COMPLETED",
        description: `Bet lost: ${bet.id}`,
      },
    });
  }
}

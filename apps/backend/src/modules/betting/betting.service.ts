import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { PlaceBetDto } from "./dto/place-bet.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { ExposureService } from "../hierarchy/exposure.service";

@Injectable()
export class BettingService {
  private readonly logger = new Logger(BettingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly exposureService: ExposureService,
  ) {}

  async placeBet(userId: string, dto: PlaceBetDto) {
    if (dto.stake <= 0) {
      throw new BadRequestException("Stake must be positive");
    }

    if (!dto.legs || dto.legs.length === 0) {
      throw new BadRequestException("At least one selection is required");
    }

    if (dto.legs.length > 1 && dto.type !== "MULTI") {
      throw new BadRequestException("Multiple selections require MULTI bet type");
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    const playerHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId },
      select: { parent: { select: { exposureLimit: true, userId: true } } },
    });

    if (playerHierarchy?.parent?.exposureLimit) {
      const playerExposure = await this.exposureService.getPlayerExposure(userId);
      const newExposure = playerExposure + dto.stake;
      if (newExposure > Number(playerHierarchy.parent.exposureLimit)) {
        throw new BadRequestException(
          `Bet would exceed exposure limit of ${playerHierarchy.parent.exposureLimit}`,
        );
      }
    }

    const legData = await this.validateAndGetOdds(dto.legs);

    let totalOdds = 1;
    for (const leg of legData) {
      totalOdds *= Number(leg.oddsValue);
    }

    const potentialWin = Math.round(dto.stake * totalOdds * 100) / 100;

    const bet = await this.prisma.$transaction(async (tx: any) => {
      const currentWallet = await tx.wallet.findUnique({ where: { userId } });
      if (!currentWallet) throw new NotFoundException("Wallet not found");

      const available = Number(currentWallet.balance) - Number(currentWallet.locked) + Number(currentWallet.bonus);
      if (dto.stake > available) {
        throw new BadRequestException("Insufficient balance");
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: currentWallet.id, version: currentWallet.version },
        data: {
          locked: { increment: dto.stake },
          version: { increment: 1 },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: currentWallet.id,
          userId,
          type: "BET_PLACED",
          amount: dto.stake,
          balanceBefore: currentWallet.balance,
          balanceAfter: updatedWallet.balance,
          status: "COMPLETED",
          description: `Bet placed: ${dto.type} stake=${dto.stake}`,
        },
      });

      const bet = await tx.bet.create({
        data: {
          userId,
          type: dto.type,
          stake: dto.stake,
          totalOdds,
          potentialWin,
          legs: {
            create: legData.map((leg) => ({
              marketId: leg.marketId,
              oddsId: leg.oddsId,
              oddsValue: leg.oddsValue,
            })),
          },
        },
        include: { legs: true },
      });

      return bet;
    });

    this.logger.log(`Bet placed: userId=${userId} stake=${dto.stake} odds=${totalOdds}`);

    return bet;
  }

  private async validateAndGetOdds(
    legs: { marketId: string; oddsId: string }[],
  ): Promise<{ marketId: string; oddsId: string; oddsValue: number }[]> {
    const results: { marketId: string; oddsId: string; oddsValue: number }[] = [];
    const seenMarkets = new Set<string>();

    for (const leg of legs) {
      const odds = await this.prisma.odds.findUnique({
        where: { id: leg.oddsId },
        include: { market: true },
      });

      if (!odds || !odds.active) {
        throw new BadRequestException(`Invalid selection: ${leg.oddsId}`);
      }

      if (odds.market.status !== "OPEN") {
        throw new BadRequestException(`Market is closed: ${odds.market.name}`);
      }

      if (odds.market.matchId) {
        const match = await this.prisma.match.findUnique({
          where: { id: odds.market.matchId },
        });
        if (match && (match.status === "FINISHED" || match.status === "CANCELLED")) {
          throw new BadRequestException(`Match is already finished: ${match.id}`);
        }
      }

      if (seenMarkets.has(odds.marketId)) {
        throw new BadRequestException("Duplicate market selections not allowed");
      }
      seenMarkets.add(odds.marketId);

      results.push({
        marketId: odds.marketId,
        oddsId: odds.id,
        oddsValue: Number(odds.value),
      });
    }

    return results;
  }

  async getBets(userId: string, pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.bet.findMany({
        where: { userId },
        include: {
          legs: {
            include: {
              market: true,
              odds: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.bet.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getActiveBets(userId: string) {
    return this.prisma.bet.findMany({
      where: { userId, status: "PENDING" },
      include: {
        legs: {
          include: {
            market: { include: { match: true } },
            odds: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getBetById(userId: string, betId: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId, userId },
      include: {
        legs: {
          include: {
            market: { include: { match: { include: { homeTeam: true, awayTeam: true } } } },
            odds: true,
          },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException("Bet not found");
    }

    return bet;
  }

  async cashOut(userId: string, betId: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId, userId, status: "PENDING" },
      include: { legs: true },
    });

    if (!bet) {
      throw new NotFoundException("Active bet not found");
    }

    const cashoutRate = this.configService.get<number>("CASHOUT_RATE", 0.5);
    const cashoutValue = Math.round(Number(bet.potentialWin) * cashoutRate * 100) / 100;

    return this.prisma.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException("Wallet not found");

      const newBalance = Number(wallet.balance) + cashoutValue;
      const newLocked = Number(wallet.locked) - Number(bet.stake);

      await tx.wallet.update({
        where: { id: wallet.id, version: wallet.version },
        data: {
          balance: newBalance,
          locked: newLocked,
          version: { increment: 1 },
        },
      });

      await tx.bet.update({
        where: { id: betId },
        data: {
          status: "CASHED_OUT",
          cashoutAmount: cashoutValue,
          settledAt: new Date(),
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: "BET_CASHED_OUT",
          amount: cashoutValue,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          status: "COMPLETED",
          description: `Cash out: bet=${betId} amount=${cashoutValue}`,
        },
      });

      return { id: betId, cashoutAmount: cashoutValue, status: "CASHED_OUT" };
    });
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DepositDto } from "./dto/deposit.dto";
import { WithdrawDto } from "./dto/withdraw.dto";
import { AddBalanceDto } from "./dto/add-balance.dto";
import { DeductBalanceDto } from "./dto/deduct-balance.dto";
import { TransferDto } from "./dto/transfer.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { ExposureService } from "../hierarchy/exposure.service";

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exposureService: ExposureService,
  ) {}

  private async runTx<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(fn);
    } catch (error: any) {
      if (error?.code === "P2025") {
        throw new BadRequestException("Concurrent update detected. Please retry.");
      }
      throw error;
    }
  }

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    return wallet;
  }

  async deposit(userId: string, dto: DepositDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    const transaction = await this.runTx(async (tx: any) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id, version: wallet.version },
        data: {
          balance: { increment: dto.amount },
          version: { increment: 1 },
        },
      });

      const txRecord = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: "DEPOSIT",
          amount: dto.amount,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          status: "COMPLETED",
          reference: dto.reference,
          description: dto.description || "Deposit",
        },
      });

      return { wallet: updatedWallet, transaction: txRecord };
    });

    this.logger.log(`Deposit: ${userId} amount=${dto.amount}`);

    return transaction;
  }

  async withdraw(userId: string, dto: WithdrawDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    const available = Number(wallet.balance) - Number(wallet.locked);
    if (dto.amount > available) {
      throw new BadRequestException("Insufficient available balance");
    }

    const transaction = await this.runTx(async (tx: any) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id, version: wallet.version },
        data: {
          balance: { decrement: dto.amount },
          version: { increment: 1 },
        },
      });

      const txRecord = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: "WITHDRAWAL",
          amount: dto.amount,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          status: "COMPLETED",
          reference: dto.reference,
          description: dto.description || "Withdrawal",
        },
      });

      return { wallet: updatedWallet, transaction: txRecord };
    });

    this.logger.log(`Withdrawal: ${userId} amount=${dto.amount}`);

    return transaction;
  }

  async addBalance(actorUserId: string, dto: AddBalanceDto) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorUserId }, select: { role: true } });
    if (!actor || (actor.role !== "SUPER_ADMIN" && actor.role !== "ADMIN")) {
      throw new ForbiddenException("Only SUPER_ADMIN/ADMIN can add balance");
    }

    const targetWallet = await this.prisma.wallet.findUnique({ where: { userId: dto.userId } });
    if (!targetWallet) {
      throw new NotFoundException("Target wallet not found");
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: dto.userId }, select: { role: true } });
    if (!targetUser || targetUser.role !== "MASTER_ID") {
      throw new BadRequestException("Can only add balance to MASTER accounts");
    }

    const transaction = await this.runTx(async (tx: any) => {
      const updated = await tx.wallet.update({
        where: { id: targetWallet.id, version: targetWallet.version },
        data: {
          balance: { increment: dto.amount },
          version: { increment: 1 },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: targetWallet.id,
          userId: dto.userId,
          type: "TRANSFER_IN",
          amount: dto.amount,
          balanceBefore: targetWallet.balance,
          balanceAfter: updated.balance,
          status: "COMPLETED",
          description: dto.description || `Balance added by ${actorUserId}`,
        },
      });

      return { wallet: updated };
    });

    this.logger.log(`addBalance: actor=${actorUserId} target=${dto.userId} amount=${dto.amount}`);
    return transaction;
  }

  async deductBalance(actorUserId: string, dto: DeductBalanceDto) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorUserId }, select: { role: true } });
    if (!actor || (actor.role !== "SUPER_ADMIN" && actor.role !== "ADMIN")) {
      throw new ForbiddenException("Only SUPER_ADMIN/ADMIN can deduct balance");
    }

    const targetWallet = await this.prisma.wallet.findUnique({ where: { userId: dto.userId } });
    if (!targetWallet) {
      throw new NotFoundException("Target wallet not found");
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: dto.userId }, select: { role: true } });
    if (!targetUser || targetUser.role !== "MASTER_ID") {
      throw new BadRequestException("Can only deduct balance from MASTER accounts");
    }

    if (dto.amount > Number(targetWallet.balance)) {
      throw new BadRequestException("Insufficient balance");
    }

    const targetHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: dto.userId },
      select: { exposureLimit: true },
    });

    if (targetHierarchy?.exposureLimit) {
      const currentExposure = await this.exposureService.getMasterExposure(dto.userId);
      const remainingAfterDeduct = Number(targetWallet.balance) - dto.amount;
      if (currentExposure > remainingAfterDeduct) {
        throw new BadRequestException(
          `Cannot deduct: current downline exposure ${currentExposure} exceeds remaining balance ${remainingAfterDeduct}`,
        );
      }
    }

    const transaction = await this.runTx(async (tx: any) => {
      const updated = await tx.wallet.update({
        where: { id: targetWallet.id, version: targetWallet.version },
        data: {
          balance: { decrement: dto.amount },
          version: { increment: 1 },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: targetWallet.id,
          userId: dto.userId,
          type: "TRANSFER_OUT",
          amount: dto.amount,
          balanceBefore: targetWallet.balance,
          balanceAfter: updated.balance,
          status: "COMPLETED",
          description: dto.description || `Balance deducted by ${actorUserId}`,
        },
      });

      return { wallet: updated };
    });

    this.logger.log(`deductBalance: actor=${actorUserId} target=${dto.userId} amount=${dto.amount}`);
    return transaction;
  }

  async transfer(fromUserId: string, dto: TransferDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    const fromUser = await this.prisma.user.findUnique({
      where: { id: fromUserId },
      select: { id: true, role: true },
    });
    if (!fromUser) {
      throw new NotFoundException("Sender not found");
    }

    const toUser = await this.prisma.user.findUnique({
      where: { id: dto.toUserId },
      select: { id: true, role: true },
    });
    if (!toUser) {
      throw new NotFoundException("Recipient not found");
    }

    const isAdmin = fromUser.role === "SUPER_ADMIN" || fromUser.role === "ADMIN";

    if (!isAdmin) {
      if (fromUser.role === "MASTER_ID" && toUser.role !== "AGENT") {
        throw new BadRequestException("Master can only transfer to Agent");
      }
      if (fromUser.role === "AGENT" && toUser.role !== "USER") {
        throw new BadRequestException("Agent can only transfer to Player");
      }
      if (fromUser.role !== "MASTER_ID" && fromUser.role !== "AGENT") {
        throw new ForbiddenException("Only Master or Agent can transfer");
      }

      const fromHierarchy = await this.prisma.userHierarchy.findUnique({
        where: { userId: fromUserId },
        select: { id: true, creditLimit: true, exposureLimit: true },
      });
      if (!fromHierarchy) {
        throw new NotFoundException("Sender hierarchy not found");
      }

      const toHierarchy = await this.prisma.userHierarchy.findUnique({
        where: { userId: dto.toUserId },
        select: { id: true, parentId: true },
      });
      if (!toHierarchy) {
        throw new NotFoundException("Recipient hierarchy not found");
      }

      if (toHierarchy.parentId !== fromHierarchy.id) {
        throw new ForbiddenException("Recipient is not your direct downline");
      }

      if (fromHierarchy.creditLimit) {
        const currentAllocated = await this.getCurrentAllocatedCredit(fromUserId);
        const newTotal = currentAllocated + dto.amount;
        if (newTotal > Number(fromHierarchy.creditLimit)) {
          throw new BadRequestException(
            `Transfer would exceed credit limit of ${fromHierarchy.creditLimit} (currently allocated: ${currentAllocated})`,
          );
        }
      }

      if (fromHierarchy.exposureLimit) {
        const currentExposure = fromUser.role === "AGENT"
          ? await this.exposureService.getAgentExposure(fromUserId)
          : fromUser.role === "MASTER_ID"
            ? await this.exposureService.getMasterExposure(fromUserId)
            : 0;
        if (currentExposure > Number(fromHierarchy.exposureLimit)) {
          throw new BadRequestException(
            `Current exposure ${currentExposure} exceeds limit ${fromHierarchy.exposureLimit}`,
          );
        }
      }
    }

    const fromWallet = await this.prisma.wallet.findUnique({ where: { userId: fromUserId } });
    if (!fromWallet) {
      throw new NotFoundException("Sender wallet not found");
    }

    const available = Number(fromWallet.balance);
    if (dto.amount > available) {
      throw new BadRequestException("Insufficient balance");
    }

    const transaction = await this.runTx(async (tx: any) => {
      const updatedFrom = await tx.wallet.update({
        where: { id: fromWallet.id, version: fromWallet.version },
        data: {
          balance: { decrement: dto.amount },
          version: { increment: 1 },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: fromWallet.id,
          userId: fromUserId,
          type: "TRANSFER_OUT",
          amount: dto.amount,
          balanceBefore: fromWallet.balance,
          balanceAfter: updatedFrom.balance,
          status: "COMPLETED",
          description: dto.description || `Transfer to ${toUser.id}`,
        },
      });

      const toWallet = await tx.wallet.findUnique({ where: { userId: dto.toUserId } });
      if (!toWallet) throw new NotFoundException("Recipient wallet not found");

      const updatedTo = await tx.wallet.update({
        where: { id: toWallet.id, version: toWallet.version },
        data: {
          balance: { increment: dto.amount },
          version: { increment: 1 },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: toWallet.id,
          userId: dto.toUserId,
          type: "TRANSFER_IN",
          amount: dto.amount,
          balanceBefore: toWallet.balance,
          balanceAfter: updatedTo.balance,
          status: "COMPLETED",
          description: dto.description || `Transfer from ${fromUserId}`,
        },
      });

      return { fromWallet: updatedFrom, toWallet: updatedTo };
    });

    this.logger.log(`transfer: from=${fromUserId} to=${dto.toUserId} amount=${dto.amount}`);
    return transaction;
  }

  private async getCurrentAllocatedCredit(parentUserId: string): Promise<number> {
    const hierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: parentUserId },
      select: { id: true },
    });
    if (!hierarchy) return 0;

    const totalSent = await this.prisma.transaction.aggregate({
      where: {
        userId: parentUserId,
        type: "TRANSFER_OUT",
        status: "COMPLETED",
        description: { startsWith: "Transfer to " },
      },
      _sum: { amount: true },
    });

    const totalReturned = await this.prisma.transaction.aggregate({
      where: {
        userId: parentUserId,
        type: "TRANSFER_IN",
        status: "COMPLETED",
        description: { startsWith: "Transfer from " },
      },
      _sum: { amount: true },
    });

    return Math.max(0, Number(totalSent._sum.amount || 0) - Number(totalReturned._sum.amount || 0));
  }

  async getTransactions(userId: string, pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUserQueryDto, SuspendUserDto, ReactivateUserDto, AdminDepositDto, AdminWithdrawDto, AdminTransferDto, AdminReportQueryDto, ResetPasswordDto } from './dto/admin-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateOddsDto } from './dto/update-odds.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async logAudit(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: any;
    ip?: string;
    previousValue?: string;
    newValue?: string;
    reason?: string;
  }) {
    await this.prisma.auditLog.create({ data: params });
  }

  async getDashboard() {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart.getTime() - todayStart.getDay() * 86400000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalUsers, activeUsers, masters, agents, players,
        totalDeposits, totalWithdrawals,
        todayDeposits, todayWithdrawals,
        totalBets, activeBets, casinoBets, sportsBets,
        liveMatches, pendingWithdrawals, pendingDeposits,
        revenueToday, revenueThisWeek, revenueThisMonth,
        totalWalletBalance, commissionPaid,
      ] = await Promise.all([
        this.prisma.user.count().catch(() => 0),
        this.prisma.user.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
        this.prisma.user.count({ where: { role: 'MASTER_ID', status: { not: 'DELETED' } } }).catch(() => 0),
        this.prisma.user.count({ where: { role: 'AGENT', status: { not: 'DELETED' } } }).catch(() => 0),
        this.prisma.user.count({ where: { role: 'USER', status: { not: 'DELETED' } } }).catch(() => 0),
        this.prisma.transaction.aggregate({
          where: { type: 'DEPOSIT', status: 'COMPLETED' },
          _sum: { amount: true },
        }).catch(() => ({ _sum: { amount: null } })),
        this.prisma.transaction.aggregate({
          where: { type: 'WITHDRAWAL', status: 'COMPLETED' },
          _sum: { amount: true },
        }).catch(() => ({ _sum: { amount: null } })),
        this.prisma.transaction.aggregate({
          where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: todayStart } },
          _sum: { amount: true },
        }).catch(() => ({ _sum: { amount: null } })),
        this.prisma.transaction.aggregate({
          where: { type: 'WITHDRAWAL', status: 'COMPLETED', createdAt: { gte: todayStart } },
          _sum: { amount: true },
        }).catch(() => ({ _sum: { amount: null } })),
        this.prisma.bet.count().catch(() => 0),
        this.prisma.bet.count({ where: { status: 'PENDING' } }).catch(() => 0),
        this.prisma.bet.count({ where: { type: 'SINGLE' } }).catch(() => 0),
        this.prisma.bet.count({ where: { type: 'MULTI' } }).catch(() => 0),
        this.prisma.match.count({ where: { status: 'LIVE' } }).catch(() => 0),
        this.prisma.transaction.count({ where: { type: 'WITHDRAWAL', status: 'PENDING' } }).catch(() => 0),
        this.prisma.transaction.count({ where: { type: 'DEPOSIT', status: 'PENDING' } }).catch(() => 0),
        this.getRevenueSince(todayStart).catch(() => 0),
        this.getRevenueSince(weekStart).catch(() => 0),
        this.getRevenueSince(monthStart).catch(() => 0),
        this.prisma.wallet.aggregate({ _sum: { balance: true } }).catch(() => ({ _sum: { balance: null } })),
        this.prisma.commission.aggregate({ _sum: { amount: true } }).catch(() => ({ _sum: { amount: null } })),
      ]);

      const [wonBets, lostBets, exposure] = await Promise.all([
        this.prisma.bet.aggregate({
          where: { status: 'WON' },
          _sum: { potentialWin: true },
        }).catch(() => ({ _sum: { potentialWin: null } })),
        this.prisma.bet.aggregate({
          where: { status: 'LOST' },
          _sum: { stake: true },
        }).catch(() => ({ _sum: { stake: null } })),
        this.getTotalExposure().catch(() => 0),
      ]);

      const profitLoss = Number(lostBets._sum.stake || 0) - Number(wonBets._sum.potentialWin || 0);

      return {
        totalUsers,
        activeUsers,
        onlineUsers: 0,
        masters,
        agents,
        players,
        totalWalletBalance: Number(totalWalletBalance._sum.balance || 0),
        totalDeposits: Number(totalDeposits._sum.amount || 0),
        totalWithdrawals: Number(totalWithdrawals._sum.amount || 0),
        todayDeposits: Number(todayDeposits._sum.amount || 0),
        todayWithdrawals: Number(todayWithdrawals._sum.amount || 0),
        totalBets,
        activeBets,
        casinoBets,
        sportsBets,
        liveMatches,
        liveGames: 0,
        pendingWithdrawals,
        pendingDeposits,
        revenueToday: Number(revenueToday),
        revenueThisWeek: Number(revenueThisWeek),
        revenueThisMonth: Number(revenueThisMonth),
        profitLoss,
        exposure,
        commissionPaid: Number(commissionPaid._sum.amount || 0),
      };
    } catch (error) {
      this.logger.error('Failed to load dashboard data', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  private async getRevenueSince(date: Date): Promise<number> {
    const stakes = await this.prisma.bet.aggregate({
      where: { status: { not: 'CANCELLED' }, createdAt: { gte: date } },
      _sum: { stake: true },
    });
    const payouts = await this.prisma.bet.aggregate({
      where: { status: 'WON', createdAt: { gte: date } },
      _sum: { potentialWin: true },
    });
    return Number(stakes._sum.stake || 0) - Number(payouts._sum.potentialWin || 0);
  }

  private async getTotalExposure(): Promise<number> {
    const pending = await this.prisma.bet.aggregate({
      where: { status: 'PENDING' },
      _sum: { stake: true, potentialWin: true },
    });
    return Number(pending._sum.potentialWin || 0);
  }

  async getOnlineUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const count = await this.prisma.user.count({
      where: { lastLoginAt: { gte: fiveMinutesAgo }, status: 'ACTIVE' },
    });
    return { onlineUsers: count };
  }

  async getUsers(query: AdminUserQueryDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { status: { not: 'DELETED' } };

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { displayName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.role) where.role = query.role;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, username: true, displayName: true, role: true, status: true,
          createdAt: true, updatedAt: true, lastLoginAt: true, referralCode: true,
          suspensionReason: true, suspensionReasonType: true, suspendedAt: true,
          wallet: { select: { balance: true, bonus: true, locked: true } },
          hierarchy: {
            select: {
              id: true, level: true, parentId: true, commissionRate: true,
              creditLimit: true, exposureLimit: true, maxPlayerCount: true,
              parent: {
                select: {
                  user: { select: { id: true, username: true, email: true, role: true } },
                },
              },
            },
          },
          _count: { select: { bets: true, transactions: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const users = data.map((u) => ({
      ...u,
      wallet: u.wallet ? { balance: Number(u.wallet.balance), bonus: Number(u.wallet.bonus), locked: Number(u.wallet.locked) } : undefined,
      parent: u.hierarchy?.parent?.user || null,
      hierarchy: u.hierarchy ? { ...u.hierarchy, parent: undefined } : null,
    }));

    return { data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        hierarchy: { include: { parent: { include: { user: { select: { id: true, username: true, email: true, role: true } } } } } },
        _count: { select: { bets: true, transactions: true, referrals: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async suspendUser(adminUserId: string, userId: string, dto: SuspendUserDto, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'SUPER_ADMIN') throw new BadRequestException('Cannot suspend a Super Admin');
    if (user.status === 'DELETED') throw new BadRequestException('Cannot suspend a deleted user');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'SUSPENDED',
        suspensionReason: dto.reason,
        suspensionReasonType: dto.reasonType as any,
        suspendedAt: new Date(),
        suspendedBy: adminUserId,
      },
      select: { id: true, email: true, username: true, role: true, status: true, suspensionReason: true, suspensionReasonType: true, suspendedAt: true },
    });

    await this.logAudit({
      userId: adminUserId, action: 'SUSPEND_USER', entity: user.role, entityId: userId,
      metadata: { reason: dto.reason, reasonType: dto.reasonType, email: user.email, username: user.username },
      ip, previousValue: user.status, newValue: 'SUSPENDED', reason: dto.reason,
    });

    this.logger.log(`User ${user.email} suspended by admin ${adminUserId}: ${dto.reason}`);
    return updated;
  }

  async reactivateUser(adminUserId: string, userId: string, dto: ReactivateUserDto, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.status !== 'SUSPENDED') throw new BadRequestException('User is not suspended');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE', suspensionReason: null, suspensionReasonType: null, suspendedAt: null, suspendedBy: null },
      select: { id: true, email: true, username: true, role: true, status: true },
    });

    await this.logAudit({
      userId: adminUserId, action: 'REACTIVATE_USER', entity: user.role, entityId: userId,
      metadata: { reason: dto.reason || 'Admin reactivation', email: user.email, username: user.username },
      ip, previousValue: 'SUSPENDED', newValue: 'ACTIVE',
    });

    this.logger.log(`User ${user.email} reactivated by admin ${adminUserId}`);
    return updated;
  }

  async softDeleteUser(adminUserId: string, userId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') throw new BadRequestException('Cannot delete an admin user');
    if (user.status === 'DELETED') throw new BadRequestException('User is already deleted');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'DELETED', deletedAt: new Date(), deletedBy: adminUserId },
      select: { id: true, email: true, username: true, role: true, status: true, deletedAt: true },
    });

    await this.logAudit({
      userId: adminUserId, action: 'DELETE_USER', entity: user.role, entityId: userId,
      metadata: { email: user.email, username: user.username },
      ip, previousValue: user.status, newValue: 'DELETED',
    });

    this.logger.log(`User ${user.email} soft-deleted by admin ${adminUserId}`);
    return updated;
  }

  async resetPassword(adminUserId: string, userId: string, dto: ResetPasswordDto, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.logAudit({
      userId: adminUserId, action: 'RESET_PASSWORD', entity: user.role, entityId: userId,
      metadata: { email: user.email, username: user.username },
      ip,
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { success: true, message: 'Password reset successfully' };
  }

  async deposit(adminUserId: string, dto: AdminDepositDto, ip?: string) {
    if (adminUserId === dto.userId) throw new BadRequestException('Cannot deposit to your own wallet');
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId }, include: { wallet: true } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.wallet) throw new BadRequestException('User has no wallet');
    if (user.status !== 'ACTIVE') throw new BadRequestException('Cannot deposit to non-active user');

    const wallet = user.wallet;
    const newBalance = Number(wallet.balance) + Number(dto.amount);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id, version: wallet.version },
        data: { balance: newBalance, version: { increment: 1 } },
      });
      return tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: dto.userId,
          type: 'DEPOSIT',
          amount: dto.amount,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          description: dto.description || 'Admin deposit',
        },
      });
    });

    await this.logAudit({
      userId: adminUserId, action: 'DEPOSIT', entity: 'WALLET', entityId: dto.userId,
      metadata: { amount: dto.amount, description: dto.description, email: user.email },
      ip,
    });

    this.logger.log(`Admin ${adminUserId} deposited ${dto.amount} to user ${user.email}`);
    return { success: true, transaction: result };
  }

  async withdraw(adminUserId: string, dto: AdminWithdrawDto, ip?: string) {
    if (adminUserId === dto.userId) throw new BadRequestException('Cannot withdraw from your own wallet');
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId }, include: { wallet: true } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.wallet) throw new BadRequestException('User has no wallet');
    if (user.status !== 'ACTIVE') throw new BadRequestException('Cannot withdraw from non-active user');

    const wallet = user.wallet;
    const currentBalance = Number(wallet.balance);
    if (currentBalance < Number(dto.amount)) throw new BadRequestException('Insufficient balance');

    const newBalance = currentBalance - Number(dto.amount);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id, version: wallet.version },
        data: { balance: newBalance, version: { increment: 1 } },
      });
      return tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: dto.userId,
          type: 'WITHDRAWAL',
          amount: dto.amount,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          description: dto.description || 'Admin withdrawal',
        },
      });
    });

    await this.logAudit({
      userId: adminUserId, action: 'WITHDRAWAL', entity: 'WALLET', entityId: dto.userId,
      metadata: { amount: dto.amount, description: dto.description, email: user.email },
      ip,
    });

    this.logger.log(`Admin ${adminUserId} withdrew ${dto.amount} from user ${user.email}`);
    return { success: true, transaction: result };
  }

  async transfer(adminUserId: string, dto: AdminTransferDto, ip?: string) {
    if (adminUserId === dto.fromUserId || adminUserId === dto.toUserId) throw new BadRequestException('Cannot transfer involving your own wallet');
    const fromUser = await this.prisma.user.findUnique({ where: { id: dto.fromUserId }, include: { wallet: true } });
    const toUser = await this.prisma.user.findUnique({ where: { id: dto.toUserId }, include: { wallet: true } });
    if (!fromUser || !toUser) throw new NotFoundException('User not found');
    if (!fromUser.wallet || !toUser.wallet) throw new BadRequestException('User has no wallet');
    if (fromUser.status !== 'ACTIVE') throw new BadRequestException('Source user is not active');

    const fromWallet = fromUser.wallet;
    const toWallet = toUser.wallet;
    const amount = Number(dto.amount);
    const fromBalance = Number(fromWallet.balance);

    if (fromBalance < amount) throw new BadRequestException('Insufficient balance');

    const newFromBalance = fromBalance - amount;
    const newToBalance = Number(toWallet.balance) + amount;

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: fromWallet.id, version: fromWallet.version },
        data: { balance: newFromBalance, version: { increment: 1 } },
      });
      await tx.wallet.update({
        where: { id: toWallet.id, version: toWallet.version },
        data: { balance: newToBalance, version: { increment: 1 } },
      });
      const fromTx = await tx.transaction.create({
        data: {
          walletId: fromWallet.id, userId: dto.fromUserId, type: 'TRANSFER_OUT',
          amount, balanceBefore: fromBalance, balanceAfter: newFromBalance,
          status: 'COMPLETED', description: dto.description || `Transfer to ${toUser.email}`,
        },
      });
      const toTx = await tx.transaction.create({
        data: {
          walletId: toWallet.id, userId: dto.toUserId, type: 'TRANSFER_IN',
          amount, balanceBefore: toWallet.balance, balanceAfter: newToBalance,
          status: 'COMPLETED', description: dto.description || `Transfer from ${fromUser.email}`,
        },
      });
      return { fromTx, toTx };
    });

    await this.logAudit({
      userId: adminUserId, action: 'TRANSFER', entity: 'WALLET', entityId: dto.fromUserId,
      metadata: { amount, from: fromUser.email, to: toUser.email },
      ip,
    });

    return { success: true, transfer: result };
  }

  async getDepositReport(query: AdminReportQueryDto) {
    const { page = 1, limit = 50, startDate, endDate, userId, role } = query;
    const skip = (page - 1) * limit;
    const where: any = { type: 'DEPOSIT' };
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (userId) where.userId = userId;
    if (role) where.user = { role };

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { user: { select: { id: true, username: true, email: true, role: true } } },
        skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getWithdrawalReport(query: AdminReportQueryDto) {
    const { page = 1, limit = 50, startDate, endDate, userId, role, status } = query;
    const skip = (page - 1) * limit;
    const where: any = { type: 'WITHDRAWAL' };
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (userId) where.userId = userId;
    if (role) where.user = { role };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { user: { select: { id: true, username: true, email: true, role: true } } },
        skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getTransactionReport(query: AdminReportQueryDto) {
    const { page = 1, limit = 50, startDate, endDate, userId, role, status } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (userId) where.userId = userId;
    if (role) where.user = { role };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { user: { select: { id: true, username: true, email: true, role: true } } },
        skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getBetReport(query: AdminReportQueryDto) {
    const { page = 1, limit = 50, startDate, endDate, userId, status } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.bet.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, email: true, role: true } },
          legs: { include: { market: true } },
        },
        skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bet.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getCommissionReport(query: AdminReportQueryDto) {
    const { page = 1, limit = 50, startDate, endDate } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        include: {
          fromUser: { select: { id: true, username: true, email: true, role: true } },
          toUser: { select: { id: true, username: true, email: true, role: true } },
        },
        skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commission.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getRevenueReport(query: AdminReportQueryDto) {
    const { startDate, endDate } = query;
    const where: any = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    const [totalStakes, totalPayouts, totalDeposits, totalWithdrawals] = await Promise.all([
      this.prisma.bet.aggregate({ where: { ...where, status: { not: 'CANCELLED' } }, _sum: { stake: true } }),
      this.prisma.bet.aggregate({ where: { ...where, status: 'WON' }, _sum: { potentialWin: true } }),
      this.prisma.transaction.aggregate({ where: { ...where, type: 'DEPOSIT', status: 'COMPLETED' }, _sum: { amount: true } }),
      this.prisma.transaction.aggregate({ where: { ...where, type: 'WITHDRAWAL', status: 'COMPLETED' }, _sum: { amount: true } }),
    ]);

    const stakes = Number(totalStakes._sum.stake || 0);
    const payouts = Number(totalPayouts._sum.potentialWin || 0);
    const revenue = stakes - payouts;
    const margin = stakes > 0 ? (revenue / stakes) * 100 : 0;

    return {
      totalStakes: stakes,
      totalPayouts: payouts,
      totalDeposits: Number(totalDeposits._sum.amount || 0),
      totalWithdrawals: Number(totalWithdrawals._sum.amount || 0),
      revenue,
      margin: Math.round(margin * 100) / 100,
    };
  }

  async getHierarchyReport(_query: AdminReportQueryDto) {
    const masters = await this.prisma.user.count({ where: { role: 'MASTER_ID', status: { not: 'DELETED' } } });
    const agents = await this.prisma.user.count({ where: { role: 'AGENT', status: { not: 'DELETED' } } });
    const players = await this.prisma.user.count({ where: { role: 'USER', status: { not: 'DELETED' } } });

    const topMasters = await this.prisma.user.findMany({
      where: { role: 'MASTER_ID', status: { not: 'DELETED' } },
      select: {
        id: true, username: true, email: true, displayName: true, status: true, createdAt: true,
        hierarchy: { select: { _count: { select: { children: true } }, commissionRate: true, creditLimit: true } },
        wallet: { select: { balance: true } },
      },
      take: 20, orderBy: { createdAt: 'desc' },
    });

    return { summary: { masters, agents, players }, topMasters };
  }

  async getAuditLogs(query: AdminReportQueryDto) {
    const { page = 1, limit = 50, startDate, endDate, userId } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (userId) where.userId = userId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, username: true, email: true, role: true } } },
        skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createMatch(adminUserId: string, dto: CreateMatchDto) {
    const match = await this.prisma.match.create({
      data: {
        leagueId: dto.leagueId,
        homeTeamId: dto.homeTeamId,
        awayTeamId: dto.awayTeamId,
        startTime: new Date(dto.startTime),
      },
      include: { homeTeam: true, awayTeam: true, league: true },
    });

    await this.logAudit({ userId: adminUserId, action: 'CREATE_MATCH', entity: 'MATCH', entityId: match.id });
    return match;
  }

  async updateMatch(adminUserId: string, matchId: string, dto: UpdateMatchDto) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        ...(dto.homeTeamId && { homeTeamId: dto.homeTeamId }),
        ...(dto.awayTeamId && { awayTeamId: dto.awayTeamId }),
        ...(dto.leagueId && { leagueId: dto.leagueId }),
        ...(dto.startTime && { startTime: new Date(dto.startTime) }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.homeScore !== undefined && { homeScore: dto.homeScore }),
        ...(dto.awayScore !== undefined && { awayScore: dto.awayScore }),
      },
      include: { homeTeam: true, awayTeam: true, league: true },
    });

    await this.logAudit({ userId: adminUserId, action: 'UPDATE_MATCH', entity: 'MATCH', entityId: matchId });
    return updated;
  }

  async addMarket(adminUserId: string, matchId: string, dto: CreateMarketDto) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const market = await this.prisma.market.create({
      data: {
        matchId,
        name: dto.name,
        type: dto.type as any,
        odds: { create: dto.odds.map((o) => ({ label: o.label, value: o.value })) },
      },
      include: { odds: true },
    });

    await this.logAudit({ userId: adminUserId, action: 'ADD_MARKET', entity: 'MARKET', entityId: market.id, metadata: { matchId } });
    return market;
  }

  async updateOdds(adminUserId: string, oddsId: string, dto: UpdateOddsDto) {
    const odds = await this.prisma.odds.findUnique({ where: { id: oddsId } });
    if (!odds) throw new NotFoundException('Odds not found');

    const updated = await this.prisma.odds.update({
      where: { id: oddsId },
      data: {
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.active !== undefined && { active: dto.active }),
        ...(dto.label !== undefined && { label: dto.label }),
      },
    });

    await this.logAudit({ userId: adminUserId, action: 'UPDATE_ODDS', entity: 'ODDS', entityId: oddsId, metadata: { previousValue: Number(odds.value), newValue: dto.value } });
    return updated;
  }

  async getTransactions(pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        include: { user: { select: { id: true, username: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.transaction.count(),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}

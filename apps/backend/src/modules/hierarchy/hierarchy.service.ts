import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";
import { ExposureService } from "./exposure.service";
import {
  CreateMasterDto,
  CreateAgentDto,
  CreatePlayerDto,
  UpdateStatusDto,
  UpdateCommissionDto,
  HierarchyQueryDto,
  UpdateUserHierarchyDto,
  MoveUserDto,
  HierarchyResetPasswordDto,
  HierarchyDepositDto,
  HierarchyWithdrawDto,
} from "./dto";

@Injectable()
export class HierarchyService {
  private readonly logger = new Logger(HierarchyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exposureService: ExposureService,
  ) {}

  private async logAudit(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    metadata?: Record<string, any>,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata: metadata || {},
      },
    });
  }

  async createMaster(adminUserId: string, dto: CreateMasterDto) {
    const adminHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: adminUserId },
    });
    if (!adminHierarchy) {
      throw new BadRequestException("Admin hierarchy not found");
    }

    await this.assertNoDuplicates(dto.email, dto.username);

    const passwordHash = await this.hashPassword(dto.password);
    const referralCode = this.generateReferralCode();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        displayName: dto.displayName || dto.username,
        role: "MASTER_ID",
        referralCode,
        createdById: adminUserId,
        wallet: { create: { balance: 0, bonus: 0, locked: 0 } },
        hierarchy: {
          create: {
            parentId: adminHierarchy.id,
            level: "LEVEL_2_MASTER",
            commissionRate: dto.commissionRate ?? 0,
            creditLimit: dto.creditLimit ?? null,
            exposureLimit: dto.exposureLimit ?? null,
            maxPlayerCount: dto.maxPlayerCount ?? null,
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        hierarchy: {
          select: {
            commissionRate: true,
            creditLimit: true,
            exposureLimit: true,
            maxPlayerCount: true,
            level: true,
          },
        },
      },
    });

    await this.logAudit(adminUserId, "CREATE", "MASTER", user.id, {
      email: user.email,
      username: user.username,
      commissionRate: dto.commissionRate,
    });

    this.logger.log(`Master created: ${user.email} by admin ${adminUserId}`);
    return user;
  }

  async createAgent(masterUserId: string, dto: CreateAgentDto) {
    const masterHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: masterUserId },
      include: { children: true },
    });
    if (!masterHierarchy) {
      throw new BadRequestException("Master hierarchy not found");
    }

    if (masterHierarchy.maxPlayerCount && masterHierarchy.children.length >= masterHierarchy.maxPlayerCount) {
      throw new BadRequestException("Master has reached maximum agent limit");
    }

    await this.assertNoDuplicates(dto.email, dto.username);

    const passwordHash = await this.hashPassword(dto.password);
    const referralCode = this.generateReferralCode();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        displayName: dto.displayName || dto.username,
        role: "AGENT",
        referralCode,
        createdById: masterUserId,
        wallet: { create: { balance: 0, bonus: 0, locked: 0 } },
        hierarchy: {
          create: {
            parentId: masterHierarchy.id,
            level: "LEVEL_3_AGENT",
            commissionRate: dto.commissionRate ?? 0,
            creditLimit: dto.creditLimit ?? null,
            exposureLimit: dto.exposureLimit ?? null,
            maxPlayerCount: dto.maxPlayerCount ?? null,
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        hierarchy: {
          select: {
            commissionRate: true,
            creditLimit: true,
            exposureLimit: true,
            maxPlayerCount: true,
            level: true,
          },
        },
      },
    });

    await this.logAudit(masterUserId, "CREATE", "AGENT", user.id, {
      email: user.email,
      username: user.username,
      commissionRate: dto.commissionRate,
    });

    this.logger.log(`Agent created: ${user.email} by master ${masterUserId}`);
    return user;
  }

  async createPlayer(agentUserId: string, dto: CreatePlayerDto) {
    const agentHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: agentUserId },
      include: { children: true },
    });
    if (!agentHierarchy) {
      throw new BadRequestException("Agent hierarchy not found");
    }

    if (agentHierarchy.maxPlayerCount && agentHierarchy.children.length >= agentHierarchy.maxPlayerCount) {
      throw new BadRequestException("Agent has reached maximum player limit");
    }

    await this.assertNoDuplicates(dto.email, dto.username);

    const passwordHash = await this.hashPassword(dto.password);
    const referralCode = this.generateReferralCode();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        displayName: dto.displayName || dto.username,
        role: "USER",
        referralCode,
        createdById: agentUserId,
        wallet: { create: { balance: 0, bonus: 0, locked: 0 } },
        hierarchy: {
          create: {
            parentId: agentHierarchy.id,
            level: "LEVEL_4_PLAYER",
            commissionRate: 0,
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await this.logAudit(agentUserId, "CREATE", "PLAYER", user.id, {
      email: user.email,
      username: user.username,
    });

    this.logger.log(`Player created: ${user.email} by agent ${agentUserId}`);
    return user;
  }

  async getMasters(query: HierarchyQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { role: "MASTER_ID" };
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { username: { contains: query.search, mode: "insensitive" } },
        { displayName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          status: true,
          createdAt: true,
          hierarchy: {
            select: {
              commissionRate: true,
              creditLimit: true,
              exposureLimit: true,
              maxPlayerCount: true,
              _count: { select: { children: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMyAgents(masterUserId: string, query: HierarchyQueryDto) {
    const masterHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: masterUserId },
    });
    if (!masterHierarchy) {
      throw new NotFoundException("Master hierarchy not found");
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      parentId: masterHierarchy.id,
      level: "LEVEL_3_AGENT",
    };

    if (query.search) {
      where.user = {
        OR: [
          { email: { contains: query.search, mode: "insensitive" } },
          { username: { contains: query.search, mode: "insensitive" } },
          { displayName: { contains: query.search, mode: "insensitive" } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.userHierarchy.findMany({
        where,
        select: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
              role: true,
              status: true,
              createdAt: true,
            },
          },
          commissionRate: true,
          creditLimit: true,
          exposureLimit: true,
          maxPlayerCount: true,
          _count: { select: { children: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.userHierarchy.count({ where }),
    ]);

    const agents = data.map((h) => ({
      ...h.user,
      commissionRate: h.commissionRate,
      creditLimit: h.creditLimit,
      exposureLimit: h.exposureLimit,
      maxPlayerCount: h.maxPlayerCount,
      playerCount: h._count.children,
    }));

    return {
      data: agents,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMyPlayers(agentUserId: string, query: HierarchyQueryDto) {
    const agentHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: agentUserId },
    });
    if (!agentHierarchy) {
      throw new NotFoundException("Agent hierarchy not found");
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      parentId: agentHierarchy.id,
      level: "LEVEL_4_PLAYER",
    };

    if (query.search) {
      where.user = {
        OR: [
          { email: { contains: query.search, mode: "insensitive" } },
          { username: { contains: query.search, mode: "insensitive" } },
          { displayName: { contains: query.search, mode: "insensitive" } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.userHierarchy.findMany({
        where,
        select: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
              role: true,
              status: true,
              createdAt: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.userHierarchy.count({ where }),
    ]);

    const players = data.map((h) => h.user);

    return {
      data: players,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTree(userId: string) {
    const hierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId },
      select: {
        id: true,
        level: true,
        commissionRate: true,
        creditLimit: true,
        exposureLimit: true,
        maxPlayerCount: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!hierarchy) {
      throw new NotFoundException("User hierarchy not found");
    }

    const children = await this.buildChildTree(hierarchy.id);

    return {
      ...hierarchy,
      children,
    };
  }

  async getUserTree(targetUserId: string) {
    return this.getTree(targetUserId);
  }

  async updateStatus(actorUserId: string, targetUserId: string, dto: UpdateStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.status === 'DELETED') {
      throw new BadRequestException("Cannot update a deleted user");
    }

    const newStatus = dto.isActive ? 'ACTIVE' : 'SUSPENDED';

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: newStatus as any, ...(newStatus === 'SUSPENDED' ? { suspendedAt: new Date(), suspendedBy: actorUserId, suspensionReason: 'Deactivated by master/agent', suspensionReasonType: 'MANUAL' } : { suspendedAt: null, suspendedBy: null, suspensionReason: null, suspensionReasonType: null }) },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
      },
    });

    await this.logAudit(actorUserId, dto.isActive ? "ACTIVATE" : "SUSPEND", user.role, targetUserId, {
      previousValue: user.status,
      newValue: newStatus,
    });

    return updated;
  }

  async updateCommission(actorUserId: string, targetUserId: string, dto: UpdateCommissionDto) {
    const hierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: targetUserId },
    });
    if (!hierarchy) {
      throw new NotFoundException("User hierarchy not found");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    });

    const updated = await this.prisma.userHierarchy.update({
      where: { userId: targetUserId },
      data: { commissionRate: dto.commissionRate },
      select: {
        commissionRate: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
      },
    });

    await this.logAudit(actorUserId, "COMMISSION_CHANGE", targetUser?.role || "USER", targetUserId, {
      previousCommission: hierarchy.commissionRate,
      newCommission: dto.commissionRate,
    });

    return updated;
  }

  async updateUser(actorUserId: string, targetUserId: string, dto: UpdateUserHierarchyDto) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException("User not found");
    if (user.status === 'DELETED') throw new BadRequestException("Cannot update a deleted user");

    const hierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: targetUserId },
    });
    if (!hierarchy) throw new NotFoundException("User hierarchy not found");

    const updateData: any = {};
    if (dto.commissionRate !== undefined) updateData.commissionRate = dto.commissionRate;
    if (dto.creditLimit !== undefined) updateData.creditLimit = dto.creditLimit;
    if (dto.exposureLimit !== undefined) updateData.exposureLimit = dto.exposureLimit;
    if (dto.maxPlayerCount !== undefined) updateData.maxPlayerCount = dto.maxPlayerCount;

    if (dto.displayName) {
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: { displayName: dto.displayName },
      });
    }

    const updated = await this.prisma.userHierarchy.update({
      where: { userId: targetUserId },
      data: updateData,
      select: {
        commissionRate: true,
        creditLimit: true,
        exposureLimit: true,
        maxPlayerCount: true,
        user: {
          select: { id: true, email: true, username: true, role: true },
        },
      },
    });

    await this.logAudit(actorUserId, "UPDATE_USER_HIERARCHY", user.role, targetUserId, {
      changes: dto,
    });

    return updated;
  }

  async moveUser(actorUserId: string, targetUserId: string, dto: MoveUserDto) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { hierarchy: true },
    });
    if (!targetUser) throw new NotFoundException("Target user not found");
    if (targetUser.status === 'DELETED') throw new BadRequestException("Cannot move a deleted user");
    if (!targetUser.hierarchy) throw new BadRequestException("Target user has no hierarchy");

    const newParent = await this.prisma.userHierarchy.findUnique({
      where: { id: dto.targetParentId },
      include: { user: { select: { id: true, username: true, role: true } } },
    });
    if (!newParent) throw new NotFoundException("Target parent hierarchy not found");

    const updated = await this.prisma.userHierarchy.update({
      where: { userId: targetUserId },
      data: { parentId: dto.targetParentId },
      select: {
        id: true,
        level: true,
        parentId: true,
        user: { select: { id: true, username: true, email: true, role: true } },
      },
    });

    await this.logAudit(actorUserId, "MOVE_USER", targetUser.role, targetUserId, {
      fromParentId: targetUser.hierarchy.parentId,
      toParentId: dto.targetParentId,
      toParentUsername: newParent.user.username,
      toParentRole: newParent.user.role,
    });

    return updated;
  }

  async getUserDetail(targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        wallet: true,
        hierarchy: {
          include: {
            parent: {
              include: {
                user: { select: { id: true, username: true, email: true, role: true } },
              },
            },
            _count: { select: { children: true } },
          },
        },
        _count: { select: { bets: true, transactions: true } },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async resetPassword(actorUserId: string, targetUserId: string, dto: HierarchyResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException("User not found");
    if (user.status === 'DELETED') throw new BadRequestException("Cannot reset password for deleted user");

    const passwordHash = await this.hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId: targetUserId } });

    await this.logAudit(actorUserId, "RESET_PASSWORD", user.role, targetUserId, {
      email: user.email,
      username: user.username,
    });

    return { success: true, message: "Password reset successfully" };
  }

  async deposit(actorUserId: string, targetUserId: string, dto: HierarchyDepositDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { wallet: true },
    });
    if (!user) throw new NotFoundException("User not found");
    if (!user.wallet) throw new BadRequestException("User has no wallet");
    if (user.status !== 'ACTIVE') throw new BadRequestException("Cannot deposit to non-active user");

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
          userId: targetUserId,
          type: 'DEPOSIT',
          amount: dto.amount,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          description: dto.description || 'Hierarchy deposit',
        },
      });
    });

    await this.logAudit(actorUserId, "DEPOSIT", "WALLET", targetUserId, {
      amount: dto.amount,
      description: dto.description,
      email: user.email,
    });

    return { success: true, transaction: result };
  }

  async withdraw(actorUserId: string, targetUserId: string, dto: HierarchyWithdrawDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { wallet: true },
    });
    if (!user) throw new NotFoundException("User not found");
    if (!user.wallet) throw new BadRequestException("User has no wallet");
    if (user.status !== 'ACTIVE') throw new BadRequestException("Cannot withdraw from non-active user");

    const wallet = user.wallet;
    const currentBalance = Number(wallet.balance);
    if (currentBalance < Number(dto.amount)) throw new BadRequestException("Insufficient balance");

    const newBalance = currentBalance - Number(dto.amount);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id, version: wallet.version },
        data: { balance: newBalance, version: { increment: 1 } },
      });
      return tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: targetUserId,
          type: 'WITHDRAWAL',
          amount: dto.amount,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          description: dto.description || 'Hierarchy withdrawal',
        },
      });
    });

    await this.logAudit(actorUserId, "WITHDRAWAL", "WALLET", targetUserId, {
      amount: dto.amount,
      description: dto.description,
      email: user.email,
    });

    return { success: true, transaction: result };
  }

  async getExposure(userId: string, role: string) {
    const exposure = await this.exposureService.getExposureByRole(userId, role);
    return { exposure };
  }

  async softDeleteUser(actorUserId: string, targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { hierarchy: { include: { children: true } } },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      throw new BadRequestException("Cannot delete admin users");
    }
    if (user.status === 'DELETED') {
      throw new BadRequestException("User is already deleted");
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        deletedBy: actorUserId,
      },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId: targetUserId } });

    await this.logAudit(actorUserId, "DELETE", user.role, targetUserId, {
      email: user.email,
      username: user.username,
    });

    return { deleted: true, userId: targetUserId };
  }

  async deleteUser(actorUserId: string, targetUserId: string, _force: boolean = false) {
    return this.softDeleteUser(actorUserId, targetUserId);
  }

  async getAnalytics() {
    const [mastersCount, agentsCount, playersCount, activeUsers, suspendedUsers, totalDeposits, totalWithdrawals] =
      await Promise.all([
        this.prisma.user.count({ where: { role: "MASTER_ID", status: { not: "DELETED" } } }),
        this.prisma.user.count({ where: { role: "AGENT", status: { not: "DELETED" } } }),
        this.prisma.user.count({ where: { role: "USER", status: { not: "DELETED" } } }),
        this.prisma.user.count({ where: { status: "ACTIVE" } }),
        this.prisma.user.count({ where: { status: "SUSPENDED" } }),
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
      activeUsers,
      suspendedUsers,
      totalExposure,
      totalDeposits: Number(totalDeposits._sum.amount || 0),
      totalWithdrawals: Number(totalWithdrawals._sum.amount || 0),
      totalPnL,
    };
  }

  async getAuditLogs(actorUserId: string, actorRole: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (actorRole === 'MASTER_ID') {
      const actorHierarchy = await this.prisma.userHierarchy.findUnique({
        where: { userId: actorUserId },
        select: { id: true },
      });
      if (actorHierarchy) {
        const agentHierarchies = await this.prisma.userHierarchy.findMany({
          where: { parentId: actorHierarchy.id },
          select: { id: true, userId: true },
        });
        const agentIds = agentHierarchies.map(a => a.userId);
        const agentHierarchyIds = agentHierarchies.map(a => a.id);
        const playerHierarchies = await this.prisma.userHierarchy.findMany({
          where: { parentId: { in: agentHierarchyIds } },
          select: { userId: true },
        });
        const playerIds = playerHierarchies.map(p => p.userId);
        const descendantIds = [actorUserId, ...agentIds, ...playerIds];
        where = { userId: { in: descendantIds } };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, email: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private async buildChildTree(parentHierarchyId: string): Promise<any[]> {
    const children = await this.prisma.userHierarchy.findMany({
      where: { parentId: parentHierarchyId },
      select: {
        id: true,
        level: true,
        commissionRate: true,
        creditLimit: true,
        exposureLimit: true,
        maxPlayerCount: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return Promise.all(
      children.map(async (child) => ({
        ...child,
        children: await this.buildChildTree(child.id),
      })),
    );
  }

  private async assertNoDuplicates(email: string, username: string) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictException("Email already registered");
    }

    const existingUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw new ConflictException("Username already taken");
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  private generateReferralCode(): string {
    return uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
  }
}

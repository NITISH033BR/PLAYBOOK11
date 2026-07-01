import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 0,
  ADMIN: 0,
  MASTER_ID: 1,
  AGENT: 2,
  USER: 3,
};

const ROLE_TO_HIERARCHY_LEVEL: Record<string, string> = {
  MASTER_ID: "LEVEL_2_MASTER",
  AGENT: "LEVEL_3_AGENT",
  USER: "LEVEL_4_PLAYER",
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createUser(creatorId: string, creatorRole: string, dto: CreateUserDto) {
    const creatorLevel = ROLE_HIERARCHY[creatorRole];
    const targetLevel = ROLE_HIERARCHY[dto.role];

    if (creatorLevel === undefined) {
      throw new ForbiddenException("Invalid creator role");
    }
    if (targetLevel === undefined) {
      throw new BadRequestException("Invalid target role");
    }

    if (creatorLevel >= targetLevel) {
      throw new ForbiddenException(
        `A ${creatorRole} cannot create a ${dto.role}. Only higher roles can create lower roles.`,
      );
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException("Email already registered");
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException("Username already taken");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    const referralCode = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();

    let referredById: string | undefined;
    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: dto.referralCode },
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    const creatorHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: creatorId },
    });
    if (!creatorHierarchy) {
      throw new ForbiddenException("Creator hierarchy not found");
    }

    const hierarchyLevel =
      ROLE_TO_HIERARCHY_LEVEL[dto.role] as
        | "LEVEL_2_MASTER"
        | "LEVEL_3_AGENT"
        | "LEVEL_4_PLAYER";

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        displayName: dto.displayName || dto.username,
        role: dto.role as any,
        referralCode,
        referredById,
        createdById: creatorId,
        wallet: {
          create: { balance: 0, bonus: 0, locked: 0 },
        },
        hierarchy: {
          create: {
            level: hierarchyLevel as any,
            parentId: creatorHierarchy.id,
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
        referralCode: true,
        createdById: true,
        createdAt: true,
      },
    });

    this.logger.log(
      `User created: ${user.email} (${user.role}) by ${creatorId} (${creatorRole})`,
    );

    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        referralCode: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            balance: true,
            bonus: true,
            locked: true,
          },
        },
        _count: {
          select: {
            referrals: true,
            bets: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        referralCode: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
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
  }
}

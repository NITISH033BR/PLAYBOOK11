import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
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

    const salt = await bcrypt.genSalt(
      Number(this.configService.get("BCRYPT_SALT_ROUNDS", 12)),
    );
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const referralCode = this.generateReferralCode();

    let referredBy: string | undefined;
    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: dto.referralCode },
      });
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        displayName: dto.displayName || dto.username,
        referralCode,
        referredById: referredBy,
        wallet: {
          create: {
            balance: 0,
            bonus: 0,
            locked: 0,
          },
        },
        hierarchy: {
          create: {
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
        referralCode: true,
        createdAt: true,
      },
    });

    if (referredBy) {
      await this.prisma.referral.create({
        data: {
          referrerId: referredBy,
          referredId: user.id,
        },
      });

      const bonusAmount = this.configService.get<number>("REFERRAL_BONUS_AMOUNT", 10);
      await this.prisma.$transaction([
        this.prisma.wallet.update({
          where: { userId: referredBy },
          data: { bonus: { increment: bonusAmount } },
        }),
        this.prisma.referral.updateMany({
          where: { referrerId: referredBy, referredId: user.id },
          data: { commissionEarned: { increment: bonusAmount } },
        }),
      ]);
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    this.logger.log(`User registered: ${user.email}`);

    return {
      ...tokens,
      user,
    };
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException("Account is suspended. Reason: " + (user.suspensionReason || 'No reason provided'));
    }
    if (user.status === 'DELETED') {
      throw new UnauthorizedException("Account not found");
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', entity: 'USER', entityId: user.id, ip },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      const user = storedToken.user;
      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedException("Account is deactivated");
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'LOGOUT', entity: 'USER', entityId: userId },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException("User not found");
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const salt = await bcrypt.genSalt(
      Number(this.configService.get("BCRYPT_SALT_ROUNDS", 12)),
    );
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRATION") || "7d",
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private generateReferralCode(): string {
    return uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
  }
}

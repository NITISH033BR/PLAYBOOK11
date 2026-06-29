import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const [totalReferrals, totalCommission] = await Promise.all([
      this.prisma.referral.count({ where: { referrerId: userId } }),
      this.prisma.referral.aggregate({
        where: { referrerId: userId },
        _sum: { commissionEarned: true },
      }),
    ]);

    return {
      totalReferrals,
      totalCommission: totalCommission._sum.commissionEarned || 0,
    };
  }

  async getCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    return { referralCode: user?.referralCode };
  }

  async getHistory(userId: string) {
    return this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            id: true,
            username: true,
            displayName: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

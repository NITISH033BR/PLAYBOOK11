import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { SportsModule } from "./modules/sports/sports.module";
import { MatchesModule } from "./modules/matches/matches.module";
import { BettingModule } from "./modules/betting/betting.module";
import { ReferralModule } from "./modules/referral/referral.module";
import { LeaderboardModule } from "./modules/leaderboard/leaderboard.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AppModule } from "./app.module";

describe("AppModule", () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AppModule,
      ],
    }).compile();
  });

  it("should be defined", () => {
    expect(module).toBeDefined();
  });

  it("should resolve AppModule", () => {
    const app = module.get(AppModule);
    expect(app).toBeDefined();
  });
});

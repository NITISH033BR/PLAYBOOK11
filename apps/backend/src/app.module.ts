import { Module } from "@nestjs/common";
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
import { LiveModule } from "./modules/live/live.module";
import { HomeModule } from "./modules/home/home.module";
import { CasinoModule } from "./modules/casino/casino.module";
import { HierarchyModule } from "./modules/hierarchy/hierarchy.module";
import { CommissionModule } from "./modules/commission/commission.module";
import { OddsModule } from "./modules/odds/odds.module";
import { AppController } from "./app.controller";
import { HealthController } from "./modules/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WalletModule,
    SportsModule,
    MatchesModule,
    BettingModule,
    ReferralModule,
    LeaderboardModule,
    NotificationsModule,
    AdminModule,
    AnalyticsModule,
    LiveModule,
    HomeModule,
    CasinoModule,
    HierarchyModule,
    CommissionModule,
    OddsModule,
  ],
  controllers: [AppController, HealthController],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { UsersModule } from "../users/users.module";
import { MatchesModule } from "../matches/matches.module";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [UsersModule, MatchesModule, WalletModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

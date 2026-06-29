import { Module } from "@nestjs/common";
import { BettingController } from "./betting.controller";
import { BettingService } from "./betting.service";
import { SettlementService } from "./settlement.service";
import { WalletModule } from "../wallet/wallet.module";
import { CommissionModule } from "../commission/commission.module";
import { HierarchyModule } from "../hierarchy/hierarchy.module";

@Module({
  imports: [WalletModule, CommissionModule, HierarchyModule],
  controllers: [BettingController],
  providers: [BettingService, SettlementService],
  exports: [BettingService, SettlementService],
})
export class BettingModule {}

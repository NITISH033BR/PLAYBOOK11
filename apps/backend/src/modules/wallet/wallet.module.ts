import { Module, forwardRef } from "@nestjs/common";
import { WalletController } from "./wallet.controller";
import { WalletService } from "./wallet.service";
import { HierarchyModule } from "../hierarchy/hierarchy.module";

@Module({
  imports: [forwardRef(() => HierarchyModule)],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}

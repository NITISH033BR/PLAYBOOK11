import { Module } from "@nestjs/common";
import { LiveGateway } from "./live.gateway";
import { LiveService } from "./live.service";
import { LiveSimulatorService } from "./live-simulator.service";
import { BettingModule } from "../betting/betting.module";

@Module({
  imports: [BettingModule],
  providers: [LiveGateway, LiveService, LiveSimulatorService],
  exports: [LiveService],
})
export class LiveModule {}

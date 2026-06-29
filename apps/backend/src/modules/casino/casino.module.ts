import { Module } from "@nestjs/common";
import { CasinoController } from "./casino.controller";
import { CasinoService } from "./casino.service";
import { CasinoPlayService } from "./casino-play.service";

@Module({
  controllers: [CasinoController],
  providers: [CasinoService, CasinoPlayService],
  exports: [CasinoService, CasinoPlayService],
})
export class CasinoModule {}

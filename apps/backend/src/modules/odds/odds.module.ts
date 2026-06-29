import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OddsService } from "./odds.service";
import { OddsController } from "./odds.controller";
import { OddsGateway } from "./odds.gateway";
import { MatchesModule } from "../matches/matches.module";
import { BettingModule } from "../betting/betting.module";

@Module({
  imports: [ConfigModule, MatchesModule, BettingModule],
  controllers: [OddsController],
  providers: [OddsService, OddsGateway],
  exports: [OddsService],
})
export class OddsModule {}

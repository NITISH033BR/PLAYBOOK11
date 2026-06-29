import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { BettingService } from "./betting.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PlaceBetDto } from "./dto/place-bet.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("Betting")
@Controller("bets")
export class BettingController {
  constructor(private readonly bettingService: BettingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Place a bet" })
  async placeBet(@CurrentUser("sub") userId: string, @Body() dto: PlaceBetDto) {
    return this.bettingService.placeBet(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get bet history" })
  async getBets(
    @CurrentUser("sub") userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.bettingService.getBets(userId, pagination);
  }

  @Get("active")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get active bets" })
  async getActiveBets(@CurrentUser("sub") userId: string) {
    return this.bettingService.getActiveBets(userId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get bet details" })
  async getBetById(
    @CurrentUser("sub") userId: string,
    @Param("id") betId: string,
  ) {
    return this.bettingService.getBetById(userId, betId);
  }

  @Post(":id/cashout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cash out a bet" })
  async cashOut(
    @CurrentUser("sub") userId: string,
    @Param("id") betId: string,
  ) {
    return this.bettingService.cashOut(userId, betId);
  }
}

import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { OddsService } from "./odds.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PlaceLiveBetDto } from "./dto/place-live-bet.dto";

@ApiTags("Odds")
@Controller("odds")
export class OddsController {
  constructor(private readonly oddsService: OddsService) {}

  @Get("sports")
  @ApiOperation({ summary: "List available sports from The Odds API" })
  async getSports() {
    return this.oddsService.getSports();
  }

  @Get("live")
  @ApiOperation({ summary: "List all live/upcoming events with odds" })
  async getLive() {
    return this.oddsService.getAllLiveEvents();
  }

  @Get(":sport")
  @ApiOperation({ summary: "List events for a specific sport" })
  async getBySport(@Param("sport") sport: string) {
    return this.oddsService.getEvents(sport);
  }

  @Get("events/:eventId")
  @ApiOperation({ summary: "Get a single event by ID" })
  async getEvent(@Param("eventId") eventId: string) {
    return this.oddsService.getEventById(eventId);
  }

  @Post("bet")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Place a bet using live odds" })
  async placeBet(
    @CurrentUser("sub") userId: string,
    @Body() dto: PlaceLiveBetDto,
  ) {
    return this.oddsService.placeLiveBet(userId, dto);
  }
}

import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { LeaderboardService } from "./leaderboard.service";

@ApiTags("Leaderboard")
@Controller("leaderboard")
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: "Get all-time leaderboard" })
  async getAllTime(@Query("limit") limit?: string) {
    return this.leaderboardService.getAllTime(limit ? parseInt(limit) : 100);
  }

  @Get("weekly")
  @ApiOperation({ summary: "Get weekly leaderboard" })
  async getWeekly(@Query("limit") limit?: string) {
    return this.leaderboardService.getWeekly(limit ? parseInt(limit) : 100);
  }
}

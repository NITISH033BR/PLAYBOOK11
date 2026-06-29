import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { HomeService } from "./home.service";

@ApiTags("Home")
@Controller("home")
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get("trending")
  @ApiOperation({ summary: "Get trending bets" })
  async getTrending(@Query("limit") limit?: string) {
    return this.homeService.getTrendingBets(limit ? parseInt(limit, 10) : 8);
  }

  @Get("featured")
  @ApiOperation({ summary: "Get featured markets from live matches" })
  async getFeatured(@Query("limit") limit?: string) {
    return this.homeService.getFeaturedMarkets(limit ? parseInt(limit, 10) : 6);
  }

  @Get("recent-winners")
  @ApiOperation({ summary: "Get recent high-value winners" })
  async getRecentWinners(@Query("limit") limit?: string) {
    return this.homeService.getRecentWinners(limit ? parseInt(limit, 10) : 10);
  }

  @Get("summary")
  @ApiOperation({ summary: "Get home page summary counts" })
  async getSummary() {
    return this.homeService.getHomeSummary();
  }
}

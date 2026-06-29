import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  @ApiOperation({ summary: "Get analytics overview" })
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get("revenue")
  @ApiOperation({ summary: "Get revenue analytics" })
  async getRevenue() {
    return this.analyticsService.getRevenue();
  }

  @Get("users")
  @ApiOperation({ summary: "Get user analytics" })
  async getUserAnalytics() {
    return this.analyticsService.getUserAnalytics();
  }

  @Get("bets")
  @ApiOperation({ summary: "Get bet analytics" })
  async getBetAnalytics() {
    return this.analyticsService.getBetAnalytics();
  }
}

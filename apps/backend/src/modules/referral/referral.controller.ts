import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ReferralService } from "./referral.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Referrals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("referrals")
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get()
  @ApiOperation({ summary: "Get referral stats" })
  async getStats(@CurrentUser("sub") userId: string) {
    return this.referralService.getStats(userId);
  }

  @Get("code")
  @ApiOperation({ summary: "Get referral code" })
  async getCode(@CurrentUser("sub") userId: string) {
    return this.referralService.getCode(userId);
  }

  @Get("history")
  @ApiOperation({ summary: "Get referral history" })
  async getHistory(@CurrentUser("sub") userId: string) {
    return this.referralService.getHistory(userId);
  }
}

import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  @ApiOperation({ summary: "Get current user profile" })
  async getProfile(@CurrentUser("sub") userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch("profile")
  @ApiOperation({ summary: "Update user profile" })
  async updateProfile(
    @CurrentUser("sub") userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}

import { Controller, Get, Patch, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get user notifications" })
  async findAll(@CurrentUser("sub") userId: string) {
    return this.notificationsService.findAll(userId);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  async getUnreadCount(@CurrentUser("sub") userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark notification as read" })
  async markAsRead(
    @CurrentUser("sub") userId: string,
    @Param("id") notificationId: string,
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  async markAllAsRead(@CurrentUser("sub") userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}

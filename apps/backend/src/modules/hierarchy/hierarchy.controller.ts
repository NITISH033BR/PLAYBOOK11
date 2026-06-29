import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HierarchyService } from './hierarchy.service';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { HierarchyGuard } from './hierarchy.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HierarchyOwnership } from './decorators/hierarchy-ownership.decorator';
import {
  CreateMasterDto, CreateAgentDto, CreatePlayerDto,
  UpdateStatusDto, UpdateCommissionDto, HierarchyQueryDto,
  UpdateUserHierarchyDto, MoveUserDto, HierarchyResetPasswordDto,
  HierarchyDepositDto, HierarchyWithdrawDto,
} from './dto';

@ApiTags('Hierarchy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hierarchy')
export class HierarchyController {
  constructor(
    private readonly hierarchyService: HierarchyService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Post('masters')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Create a Master (Admin only)' })
  async createMaster(@CurrentUser() user: any, @Body() dto: CreateMasterDto) {
    return this.hierarchyService.createMaster(user.sub, dto);
  }

  @Get('masters')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all Masters (Admin only)' })
  async getMasters(@Query() query: HierarchyQueryDto) {
    return this.hierarchyService.getMasters(query);
  }

  @Post('agents')
  @Roles('MASTER_ID')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Create an Agent (Master only)' })
  async createAgent(@CurrentUser() user: any, @Body() dto: CreateAgentDto) {
    return this.hierarchyService.createAgent(user.sub, dto);
  }

  @Get('my-agents')
  @Roles('MASTER_ID')
  @ApiOperation({ summary: 'List own Agents (Master only)' })
  async getMyAgents(@CurrentUser() user: any, @Query() query: HierarchyQueryDto) {
    return this.hierarchyService.getMyAgents(user.sub, query);
  }

  @Post('players')
  @Roles('AGENT')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Create a Player (Agent only)' })
  async createPlayer(@CurrentUser() user: any, @Body() dto: CreatePlayerDto) {
    return this.hierarchyService.createPlayer(user.sub, dto);
  }

  @Get('my-players')
  @Roles('AGENT')
  @ApiOperation({ summary: 'List own Players (Agent only)' })
  async getMyPlayers(@CurrentUser() user: any, @Query() query: HierarchyQueryDto) {
    return this.hierarchyService.getMyPlayers(user.sub, query);
  }

  @Patch('users/:id/status')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID', 'AGENT')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Toggle user status (Admin/Master/Agent)' })
  async updateStatus(
    @CurrentUser() user: any, @Param('id') userId: string, @Body() dto: UpdateStatusDto,
  ) {
    return this.hierarchyService.updateStatus(user.sub, userId, dto);
  }

  @Patch('users/:id/commission')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Update user commission rate (Admin/Master)' })
  async updateCommission(
    @CurrentUser() user: any, @Param('id') userId: string, @Body() dto: UpdateCommissionDto,
  ) {
    return this.hierarchyService.updateCommission(user.sub, userId, dto);
  }

  @Get('tree')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID', 'AGENT')
  @ApiOperation({ summary: 'Get own hierarchy subtree' })
  async getTree(@CurrentUser() user: any) {
    return this.hierarchyService.getTree(user.sub);
  }

  @Get('users/:id/tree')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get any user\'s hierarchy tree (Admin only)' })
  async getUserTree(@Param('id') userId: string) {
    return this.hierarchyService.getUserTree(userId);
  }

  @Get('exposure')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID', 'AGENT')
  @ApiOperation({ summary: 'Get own exposure' })
  async getExposure(@CurrentUser() user: any) {
    return this.hierarchyService.getExposure(user.sub, user.role);
  }

  @Get('dashboard/admin')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('dashboard/master')
  @Roles('MASTER_ID')
  @ApiOperation({ summary: 'Master dashboard stats' })
  async getMasterDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getMasterDashboard(user.sub);
  }

  @Get('dashboard/agent')
  @Roles('AGENT')
  @ApiOperation({ summary: 'Agent dashboard stats' })
  async getAgentDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getAgentDashboard(user.sub);
  }

  @Get('dashboard/player')
  @Roles('USER')
  @ApiOperation({ summary: 'Player dashboard stats' })
  async getPlayerDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getPlayerDashboard(user.sub);
  }

  @Delete('users/:id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID', 'AGENT')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Soft delete a user from hierarchy' })
  async deleteUser(@CurrentUser() user: any, @Param('id') userId: string, @Query('force') force?: string) {
    return this.hierarchyService.deleteUser(user.sub, userId, force === 'true');
  }

  @Get('users/:id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID', 'AGENT')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Get single user detail with wallet, hierarchy, counts' })
  async getUserDetail(@CurrentUser() user: any, @Param('id') userId: string) {
    return this.hierarchyService.getUserDetail(userId);
  }

  @Patch('users/:id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID', 'AGENT')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Update user hierarchy settings (commission, limits)' })
  async updateUser(
    @CurrentUser() user: any, @Param('id') userId: string, @Body() dto: UpdateUserHierarchyDto,
  ) {
    return this.hierarchyService.updateUser(user.sub, userId, dto);
  }

  @Post('users/:id/reset-password')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID', 'AGENT')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Reset user password' })
  async resetPassword(
    @CurrentUser() user: any, @Param('id') userId: string, @Body() dto: HierarchyResetPasswordDto,
  ) {
    return this.hierarchyService.resetPassword(user.sub, userId, dto);
  }

  @Post('users/:id/move')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Move user to a different parent in the hierarchy' })
  async moveUser(
    @CurrentUser() user: any, @Param('id') userId: string, @Body() dto: MoveUserDto,
  ) {
    return this.hierarchyService.moveUser(user.sub, userId, dto);
  }

  @Post('users/:id/deposit')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID', 'AGENT')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Deposit to user wallet (Admin/Master/Agent)' })
  async deposit(
    @CurrentUser() user: any, @Param('id') userId: string, @Body() dto: HierarchyDepositDto,
  ) {
    return this.hierarchyService.deposit(user.sub, userId, dto);
  }

  @Post('users/:id/withdraw')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID', 'AGENT')
  @UseGuards(HierarchyGuard)
  @HierarchyOwnership('subtree')
  @ApiOperation({ summary: 'Withdraw from user wallet (Admin/Master/Agent)' })
  async withdraw(
    @CurrentUser() user: any, @Param('id') userId: string, @Body() dto: HierarchyWithdrawDto,
  ) {
    return this.hierarchyService.withdraw(user.sub, userId, dto);
  }

  @Get('analytics')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Hierarchy analytics (Admin only)' })
  async getAnalytics() {
    return this.hierarchyService.getAnalytics();
  }

  @Get('audit-logs')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MASTER_ID')
  @ApiOperation({ summary: 'Hierarchy audit logs' })
  async getAuditLogs(@CurrentUser() user: any, @Query() query: { page?: number; limit?: number }) {
    return this.hierarchyService.getAuditLogs(user.sub, user.role, query);
  }
}

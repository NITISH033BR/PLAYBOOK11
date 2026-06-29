import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateOddsDto } from './dto/update-odds.dto';
import {
  AdminUserQueryDto, SuspendUserDto, ReactivateUserDto,
  AdminDepositDto, AdminWithdrawDto, AdminTransferDto,
  AdminReportQueryDto, ResetPasswordDto,
} from './dto/admin-user.dto';
import { Request } from 'express';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive admin dashboard stats' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with search, filter, pagination' })
  async getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get single user detail' })
  async getUserDetail(@Param('id') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user with reason' })
  async suspendUser(
    @CurrentUser() user: any,
    @Param('id') userId: string,
    @Body() dto: SuspendUserDto,
    @Req() req: Request,
  ) {
    return this.adminService.suspendUser(user.sub, userId, dto, req.ip);
  }

  @Patch('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended user' })
  async reactivateUser(
    @CurrentUser() user: any,
    @Param('id') userId: string,
    @Body() dto: ReactivateUserDto,
    @Req() req: Request,
  ) {
    return this.adminService.reactivateUser(user.sub, userId, dto, req.ip);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Soft delete a user' })
  async softDeleteUser(
    @CurrentUser() user: any,
    @Param('id') userId: string,
    @Req() req: Request,
  ) {
    return this.adminService.softDeleteUser(user.sub, userId, req.ip);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  async resetPassword(
    @CurrentUser() user: any,
    @Param('id') userId: string,
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    return this.adminService.resetPassword(user.sub, userId, dto, req.ip);
  }

  @Post('wallet/deposit')
  @ApiOperation({ summary: 'Admin deposit to user wallet' })
  async deposit(
    @CurrentUser() user: any,
    @Body() dto: AdminDepositDto,
    @Req() req: Request,
  ) {
    return this.adminService.deposit(user.sub, dto, req.ip);
  }

  @Post('wallet/withdraw')
  @ApiOperation({ summary: 'Admin withdraw from user wallet' })
  async withdraw(
    @CurrentUser() user: any,
    @Body() dto: AdminWithdrawDto,
    @Req() req: Request,
  ) {
    return this.adminService.withdraw(user.sub, dto, req.ip);
  }

  @Post('wallet/transfer')
  @ApiOperation({ summary: 'Admin transfer between users' })
  async transfer(
    @CurrentUser() user: any,
    @Body() dto: AdminTransferDto,
    @Req() req: Request,
  ) {
    return this.adminService.transfer(user.sub, dto, req.ip);
  }

  @Get('reports/deposits')
  @ApiOperation({ summary: 'Deposit report' })
  async getDepositReport(@Query() query: AdminReportQueryDto) {
    return this.adminService.getDepositReport(query);
  }

  @Get('reports/withdrawals')
  @ApiOperation({ summary: 'Withdrawal report' })
  async getWithdrawalReport(@Query() query: AdminReportQueryDto) {
    return this.adminService.getWithdrawalReport(query);
  }

  @Get('reports/transactions')
  @ApiOperation({ summary: 'Transaction report' })
  async getTransactionReport(@Query() query: AdminReportQueryDto) {
    return this.adminService.getTransactionReport(query);
  }

  @Get('reports/bets')
  @ApiOperation({ summary: 'Bet report' })
  async getBetReport(@Query() query: AdminReportQueryDto) {
    return this.adminService.getBetReport(query);
  }

  @Get('reports/commissions')
  @ApiOperation({ summary: 'Commission report' })
  async getCommissionReport(@Query() query: AdminReportQueryDto) {
    return this.adminService.getCommissionReport(query);
  }

  @Get('reports/revenue')
  @ApiOperation({ summary: 'Revenue report' })
  async getRevenueReport(@Query() query: AdminReportQueryDto) {
    return this.adminService.getRevenueReport(query);
  }

  @Get('reports/hierarchy')
  @ApiOperation({ summary: 'Hierarchy report' })
  async getHierarchyReport(@Query() query: AdminReportQueryDto) {
    return this.adminService.getHierarchyReport(query);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  async getAuditLogs(@Query() query: AdminReportQueryDto) {
    return this.adminService.getAuditLogs(query);
  }

  @Get('online-users')
  @ApiOperation({ summary: 'Get online user count' })
  async getOnlineUsers() {
    return this.adminService.getOnlineUsers();
  }

  @Post('matches')
  @ApiOperation({ summary: 'Create a match' })
  async createMatch(@CurrentUser() user: any, @Body() dto: CreateMatchDto) {
    return this.adminService.createMatch(user.sub, dto);
  }

  @Patch('matches/:id')
  @ApiOperation({ summary: 'Update match' })
  async updateMatch(
    @CurrentUser() user: any,
    @Param('id') matchId: string,
    @Body() dto: UpdateMatchDto,
  ) {
    return this.adminService.updateMatch(user.sub, matchId, dto);
  }

  @Post('matches/:id/markets')
  @ApiOperation({ summary: 'Add market to match' })
  async addMarket(
    @CurrentUser() user: any,
    @Param('id') matchId: string,
    @Body() dto: CreateMarketDto,
  ) {
    return this.adminService.addMarket(user.sub, matchId, dto);
  }

  @Patch('odds/:id')
  @ApiOperation({ summary: 'Update odds' })
  async updateOdds(
    @CurrentUser() user: any,
    @Param('id') oddsId: string,
    @Body() dto: UpdateOddsDto,
  ) {
    return this.adminService.updateOdds(user.sub, oddsId, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions' })
  async getTransactions(@Query() pagination: PaginationDto) {
    return this.adminService.getTransactions(pagination);
  }
}

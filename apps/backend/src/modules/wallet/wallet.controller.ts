import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { DepositDto } from "./dto/deposit.dto";
import { WithdrawDto } from "./dto/withdraw.dto";
import { AddBalanceDto } from "./dto/add-balance.dto";
import { DeductBalanceDto } from "./dto/deduct-balance.dto";
import { TransferDto } from "./dto/transfer.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("Wallet")
@ApiBearerAuth()
@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: "Get wallet balance" })
  async getWallet(@CurrentUser("sub") userId: string) {
    return this.walletService.getWallet(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("deposit")
  @ApiOperation({ summary: "Deposit funds" })
  async deposit(@CurrentUser("sub") userId: string, @Body() dto: DepositDto) {
    return this.walletService.deposit(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("withdraw")
  @ApiOperation({ summary: "Withdraw funds" })
  async withdraw(@CurrentUser("sub") userId: string, @Body() dto: WithdrawDto) {
    return this.walletService.withdraw(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("transactions")
  @ApiOperation({ summary: "Get transaction history" })
  async getTransactions(
    @CurrentUser("sub") userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.walletService.getTransactions(userId, pagination);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post("add-balance")
  @ApiOperation({ summary: "Add balance to Master (Admin only)" })
  async addBalance(@CurrentUser() user: any, @Body() dto: AddBalanceDto) {
    return this.walletService.addBalance(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post("deduct-balance")
  @ApiOperation({ summary: "Deduct balance from Master (Admin only)" })
  async deductBalance(@CurrentUser() user: any, @Body() dto: DeductBalanceDto) {
    return this.walletService.deductBalance(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "MASTER_ID", "AGENT")
  @Post("transfer")
  @ApiOperation({ summary: "Transfer to downline (Master→Agent or Agent→Player)" })
  async transfer(@CurrentUser() user: any, @Body() dto: TransferDto) {
    return this.walletService.transfer(user.sub, dto);
  }
}

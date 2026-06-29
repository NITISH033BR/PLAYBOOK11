import { UserRole, UserStatus } from "./auth.types";
import { TransactionStatus } from "./wallet.types";

export interface AdminDashboardResponse {
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  masters: number;
  agents: number;
  players: number;
  totalWalletBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  todayDeposits: number;
  todayWithdrawals: number;
  totalBets: number;
  activeBets: number;
  casinoBets: number;
  sportsBets: number;
  liveMatches: number;
  liveGames: number;
  pendingWithdrawals: number;
  pendingDeposits: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  profitLoss: number;
  exposure: number;
  commissionPaid: number;
}

export interface DashboardTrend {
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

export interface RevenueData {
  date: string;
  revenue: number;
  bets: number;
  deposits: number;
  withdrawals: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  wallet?: {
    balance: number;
    bonus: number;
    locked: number;
  };
  hierarchy?: {
    id: string;
    level: string;
    parentId?: string;
    commissionRate?: number;
    creditLimit?: number;
    exposureLimit?: number;
    maxPlayerCount?: number;
  };
  parent?: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
  _count?: {
    bets: number;
    transactions: number;
  };
}

export interface AdminUserDetail extends AdminUser {
  bets: any[];
  transactions: any[];
  commissions: any[];
  referrals: any[];
  auditLogs: any[];
}

export interface SuspendUserDto {
  reason: string;
  reasonType: "FRAUD" | "BONUS_ABUSE" | "SUSPICIOUS_BETTING" | "MULTI_ACCOUNT" | "MANUAL" | "OTHER";
}

export interface ReactivateUserDto {
  reason?: string;
}

export interface AdminDepositDto {
  userId: string;
  amount: number;
  description?: string;
}

export interface AdminWithdrawDto {
  userId: string;
  amount: number;
  description?: string;
}

export interface AdminTransferDto {
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
}

export interface AdminReportFilter {
  startDate?: string;
  endDate?: string;
  role?: UserRole;
  status?: UserStatus;
  masterId?: string;
  agentId?: string;
  playerId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DepositReport {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  amount: number;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
  processedBy?: string;
}

export interface WithdrawalReport {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  amount: number;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
  processedBy?: string;
}

export interface CommissionReport {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  amount: number;
  rate: number;
  type: string;
  createdAt: string;
}

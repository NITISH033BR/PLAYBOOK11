export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  BET_PLACED = "BET_PLACED",
  BET_WON = "BET_WON",
  BET_LOST = "BET_LOST",
  BET_CASHED_OUT = "BET_CASHED_OUT",
  REFERRAL_BONUS = "REFERRAL_BONUS",
  ADMIN_ADJUST = "ADMIN_ADJUST",
  COMMISSION = "COMMISSION",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface WalletResponse {
  id: string;
  userId: string;
  balance: number;
  bonus: number;
  locked: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  reference?: string;
  description?: string;
  createdAt: string;
}

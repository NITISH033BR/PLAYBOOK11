import { UserRole, UserStatus } from "./auth.types";

export enum HierarchyLevel {
  LEVEL_1_ADMIN = "LEVEL_1_ADMIN",
  LEVEL_2_MASTER = "LEVEL_2_MASTER",
  LEVEL_3_AGENT = "LEVEL_3_AGENT",
  LEVEL_4_PLAYER = "LEVEL_4_PLAYER",
}

export enum CommissionType {
  BET_PLACED = "BET_PLACED",
  BET_WON = "BET_WON",
  REFERRAL = "REFERRAL",
}

export interface UserHierarchyResponse {
  id: string;
  userId: string;
  parentId?: string;
  level: HierarchyLevel;
  commissionRate?: number;
  creditLimit?: number;
  exposureLimit?: number;
  maxPlayerCount?: number;
  user?: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    isActive: boolean;
    displayName: string;
    createdAt: string;
  };
  children?: UserHierarchyResponse[];
}

export interface HierarchyNode {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  level: HierarchyLevel;
  commissionRate?: number;
  childrenCount: number;
  children?: HierarchyNode[];
}

export interface CreateMasterDto {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  commissionRate?: number;
  creditLimit?: number;
  exposureLimit?: number;
  maxPlayerCount?: number;
}

export interface CreateAgentDto {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  commissionRate?: number;
  creditLimit?: number;
  exposureLimit?: number;
  maxPlayerCount?: number;
}

export interface CreatePlayerDto {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface UpdateCommissionDto {
  commissionRate: number;
}

export interface UpdateStatusDto {
  isActive: boolean;
}

export interface HierarchyAuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ip?: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
}

export interface HierarchyAnalytics {
  totalMasters: number;
  totalAgents: number;
  totalPlayers: number;
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalCommission: number;
  profitLoss: number;
  activeUsers: number;
  suspendedUsers: number;
}

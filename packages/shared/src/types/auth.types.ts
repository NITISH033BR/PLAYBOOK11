export enum UserRole {
  USER = "USER",
  AGENT = "AGENT",
  MASTER_ID = "MASTER_ID",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  referralCode: string;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  referralCode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const ROLES_KEY = "roles";
export const ROLES = {
  USER: "USER",
  AGENT: "AGENT",
  MASTER_ID: "MASTER_ID",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

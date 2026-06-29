export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  BAD_REQUEST: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  INVALID_ODDS: "INVALID_ODDS",
  BETTING_CLOSED: "BETTING_CLOSED",
  RATE_LIMIT: "RATE_LIMIT",
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "You do not have permission to perform this action",
  NOT_FOUND: "Resource not found",
  BAD_REQUEST: "Invalid request",
  CONFLICT: "Resource already exists",
  VALIDATION_ERROR: "Validation failed",
  INTERNAL_ERROR: "Internal server error",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INVALID_ODDS: "Odds have changed, please refresh",
  BETTING_CLOSED: "Betting is closed for this market",
  RATE_LIMIT: "Too many requests, please try again later",
};

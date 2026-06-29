import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(
  amount: number | string | { toString: () => string },
  options?: { compact?: boolean; decimals?: number }
): string {
  const num = typeof amount === "number" ? amount : Number(amount);

  if (options?.compact) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      minimumFractionDigits: options.decimals ?? 1,
      maximumFractionDigits: options.decimals ?? 1,
    }).format(num);
  }

  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: options?.decimals ?? 2,
    maximumFractionDigits: options?.decimals ?? 2,
  }).format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "PENDING":
    case "SCHEDULED":
      return "text-yellow-400";
    case "WON":
    case "COMPLETED":
    case "LIVE":
      return "text-green-400";
    case "LOST":
    case "CANCELLED":
    case "FAILED":
      return "text-red-400";
    case "CASHED_OUT":
      return "text-blue-400";
    case "FINISHED":
      return "text-gray-400";
    default:
      return "text-gray-400";
  }
}

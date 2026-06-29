"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { betsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function usePlaceBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      stake: number;
      type: "SINGLE" | "MULTI";
      legs: { marketId: string; oddsId: string }[];
    }) => betsApi.placeBet(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("Bet placed successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to place bet");
    },
  });
}

export function useBets(params?: { page?: number; limit?: number }) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["bets", params],
    queryFn: () => betsApi.getBets(params).then((r) => r.data),
    enabled: !!user,
  });
}

export function useActiveBets() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["bets", "active"],
    queryFn: () => betsApi.getActive().then((r) => r.data),
    enabled: !!user,
    refetchInterval: 10000,
  });
}

export function useCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (betId: string) => betsApi.cashout(betId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("Bet cashed out successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Cash out failed");
    },
  });
}

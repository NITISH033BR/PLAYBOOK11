"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { walletApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function useWallet() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletApi.getWallet().then((r) => r.data),
    enabled: !!user,
    refetchInterval: 15000,
  });
}

export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: number }) =>
      walletApi.deposit(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("Deposit successful");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Deposit failed");
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: number }) =>
      walletApi.withdraw(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("Withdrawal successful");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Withdrawal failed");
    },
  });
}

export function useTransactions(params?: { page?: number; limit?: number }) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => walletApi.getTransactions(params).then((r) => r.data),
    enabled: !!user,
  });
}

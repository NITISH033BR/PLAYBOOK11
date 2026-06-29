"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export function useAdminDashboard() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.getDashboard().then((r) => r.data),
    enabled: user?.role === "ADMIN" || user?.role === "SUPER_ADMIN",
  });
}

export function useAdminUsers(params?: { page?: number; limit?: number }) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminApi.getUsers(params).then((r) => r.data),
    enabled: user?.role === "ADMIN" || user?.role === "SUPER_ADMIN",
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => adminApi.createMatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "matches"] });
      toast.success("Match created");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create match");
    },
  });
}

export function useUpdateOdds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.updateOdds(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match"] });
      toast.success("Odds updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update odds");
    },
  });
}

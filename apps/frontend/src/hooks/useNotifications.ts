"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function useNotifications() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useUnreadCount() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => notificationsApi.getUnreadCount().then((r) => r.data),
    enabled: !!user,
    refetchInterval: 15000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

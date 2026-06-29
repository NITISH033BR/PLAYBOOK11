"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { casinoApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export function useCasinoPlay() {
  const queryClient = useQueryClient();

  const play = useMutation({
    mutationFn: (data: { gameSlug: string; betAmount: number; betData?: Record<string, any> }) =>
      casinoApi.play(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to play");
    },
  });

  const hit = useMutation({
    mutationFn: (sessionId: string) => casinoApi.blackjackHit(sessionId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to hit");
    },
  });

  const stand = useMutation({
    mutationFn: (sessionId: string) => casinoApi.blackjackStand(sessionId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to stand");
    },
  });

  return { play, hit, stand };
}

export function useCasinoSessions(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["casino", "sessions", page, limit],
    queryFn: () => casinoApi.getSessions({ page, limit }).then((r) => r.data),
  });
}

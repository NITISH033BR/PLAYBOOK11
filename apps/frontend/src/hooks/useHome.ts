"use client";

import { useQuery } from "@tanstack/react-query";
import { homeApi, leaderboardApi } from "@/lib/api";

export function useTrendingBets(limit = 8) {
  return useQuery({
    queryKey: ["home", "trending", limit],
    queryFn: () => homeApi.getTrending(limit).then((r) => r.data),
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export function useFeaturedMarkets(limit = 6) {
  return useQuery({
    queryKey: ["home", "featured", limit],
    queryFn: () => homeApi.getFeatured(limit).then((r) => r.data),
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export function useRecentWinners(limit = 10) {
  return useQuery({
    queryKey: ["home", "recent-winners", limit],
    queryFn: () => homeApi.getRecentWinners(limit).then((r) => r.data),
    staleTime: 10000,
    refetchInterval: 15000,
  });
}

export function useHomeSummary() {
  return useQuery({
    queryKey: ["home", "summary"],
    queryFn: () => homeApi.getSummary().then((r) => r.data),
    staleTime: 30000,
  });
}

export function useTopWinners(limit = 3) {
  return useQuery({
    queryKey: ["leaderboard", "home", limit],
    queryFn: () => leaderboardApi.getAllTime(limit).then((r) => r.data),
    staleTime: 30000,
  });
}

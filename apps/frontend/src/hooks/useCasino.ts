"use client";

import { useQuery } from "@tanstack/react-query";
import { casinoApi } from "@/lib/api";

export function useCasinoCategories() {
  return useQuery({
    queryKey: ["casino", "categories"],
    queryFn: () => casinoApi.getCategories().then((r) => r.data),
    staleTime: 60000,
  });
}

export function useCasinoGames(params?: {
  category?: string;
  featured?: string;
  popular?: string;
  search?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["casino", "games", params],
    queryFn: () => casinoApi.getGames(params).then((r) => r.data),
    staleTime: 30000,
  });
}

export function useCasinoGame(slug: string) {
  return useQuery({
    queryKey: ["casino", "game", slug],
    queryFn: () => casinoApi.getGameBySlug(slug).then((r) => r.data),
    enabled: !!slug,
    staleTime: 30000,
  });
}

export function useCasinoPromotions() {
  return useQuery({
    queryKey: ["casino", "promotions"],
    queryFn: () => casinoApi.getPromotions().then((r) => r.data),
    staleTime: 60000,
  });
}

export function useFeaturedCasinoGames(limit = 8) {
  return useQuery({
    queryKey: ["casino", "featured", limit],
    queryFn: () => casinoApi.getFeatured(limit).then((r) => r.data),
    staleTime: 30000,
  });
}

export function useCasinoWinners(limit = 10) {
  return useQuery({
    queryKey: ["casino", "winners", limit],
    queryFn: () => casinoApi.getWinners(limit).then((r) => r.data),
    staleTime: 10000,
  });
}

export function useCasinoTrending(limit = 8) {
  return useQuery({
    queryKey: ["casino", "trending", limit],
    queryFn: () => casinoApi.getTrending(limit).then((r) => r.data),
    staleTime: 30000,
  });
}

export function useCasinoNewReleases(limit = 8) {
  return useQuery({
    queryKey: ["casino", "new-releases", limit],
    queryFn: () => casinoApi.getNewReleases(limit).then((r) => r.data),
    staleTime: 30000,
  });
}

export function useCasinoRecentlyPlayed(limit = 8) {
  return useQuery({
    queryKey: ["casino", "recently-played", limit],
    queryFn: () => casinoApi.getRecentlyPlayed(limit).then((r) => r.data),
    staleTime: 10000,
  });
}

export function useCasinoLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ["casino", "leaderboard", limit],
    queryFn: () => casinoApi.getLeaderboard(limit).then((r) => r.data),
    staleTime: 15000,
  });
}

export function useCasinoStats() {
  return useQuery({
    queryKey: ["casino", "stats"],
    queryFn: () => casinoApi.getStats().then((r) => r.data),
    staleTime: 30000,
  });
}

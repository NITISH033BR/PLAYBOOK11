"use client";

import { useQuery } from "@tanstack/react-query";
import { sportsApi, matchesApi } from "@/lib/api";

export function useSports() {
  return useQuery({
    queryKey: ["sports"],
    queryFn: () => sportsApi.getAll().then((r) => r.data),
    staleTime: 60000,
  });
}

export function useMatches(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["matches", params],
    queryFn: () => matchesApi.getAll(params).then((r) => r.data),
    staleTime: 30000,
  });
}

export function useLiveMatches() {
  return useQuery({
    queryKey: ["matches", "live"],
    queryFn: () => matchesApi.getLive().then((r) => r.data),
    refetchInterval: 15000,
  });
}

export function useUpcomingMatches(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["matches", "upcoming", params],
    queryFn: () => matchesApi.getUpcoming(params).then((r) => r.data),
    staleTime: 30000,
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ["match", id],
    queryFn: () => matchesApi.getById(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 15000,
  });
}

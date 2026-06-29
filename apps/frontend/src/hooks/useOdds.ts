import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { oddsApi } from "@/lib/api";

export function useOddsSports() {
  return useQuery({
    queryKey: ["odds", "sports"],
    queryFn: () => oddsApi.getSports().then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });
}

export function useOddsLive() {
  return useQuery({
    queryKey: ["odds", "live"],
    queryFn: () => oddsApi.getLive().then((r) => r.data?.data ?? r.data),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useOddsBySport(sport: string) {
  return useQuery({
    queryKey: ["odds", sport],
    queryFn: () => oddsApi.getBySport(sport).then((r) => r.data?.data ?? r.data),
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: !!sport,
  });
}

export function useOddsEvent(eventId: string) {
  return useQuery({
    queryKey: ["odds", "event", eventId],
    queryFn: () => oddsApi.getEvent(eventId).then((r) => r.data?.data ?? r.data),
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: !!eventId,
  });
}

export function usePlaceLiveBet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { eventId: string; marketKey: string; outcomeName: string; odds: number; stake: number }) =>
      oddsApi.placeBet(data).then((r) => r.data?.data ?? r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["bets"] });
    },
  });
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { useOddsSports, useOddsLive, usePlaceLiveBet } from "@/hooks/useOdds";
import { useLiveOdds } from "@/hooks/useLiveOdds";
import { useAuthStore } from "@/store/authStore";
import { useBetSlipStore } from "@/store/betSlipStore";
import { useUIStore } from "@/store/uiStore";
import Link from "next/link";

const SPORT_ORDER = [
  "americanfootball_nfl",
  "americanfootball_ncaaf",
  "basketball_nba",
  "basketball_ncaab",
  "icehockey_nhl",
  "baseball_mlb",
  "soccer_usa_mls",
  "soccer_epl",
  "soccer_uefa_champs_league",
  "mma_mixed_martial_arts",
];

export default function OddsPage() {
  const { data: sports, isLoading: sportsLoading, error: sportsError } = useOddsSports();
  const { data: httpEvents, isLoading: eventsLoading, error: eventsError } = useOddsLive();
  const { events: wsEvents, connected: wsConnected } = useLiveOdds();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addSelection = useBetSlipStore((s) => s.addSelection);
  const openBetSlip = useUIStore((s) => s.openBetSlip);

  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"all" | "live" | "upcoming" | "finished">("all");

  const events = wsConnected && wsEvents.length > 0 ? wsEvents : httpEvents;

  const sortedSports = useMemo(() => {
    if (!sports) return [];
    const ordered = SPORT_ORDER.map((k) => sports.find((s: any) => s.key === k)).filter(Boolean);
    const rest = sports.filter((s: any) => !SPORT_ORDER.includes(s.key));
    return [...ordered, ...rest];
  }, [sports]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let filtered = selectedSport
      ? events.filter((e: any) => e.sportKey === selectedSport)
      : events;
    if (selectedTab === "live") {
      filtered = filtered.filter((e: any) => e.status === "live");
    } else if (selectedTab === "upcoming") {
      filtered = filtered.filter((e: any) => e.status === "upcoming");
    } else if (selectedTab === "finished") {
      filtered = filtered.filter((e: any) => e.status === "finished");
    }
    return filtered;
  }, [events, selectedSport, selectedTab]);

  const liveCount = useMemo(() => {
    if (!events) return 0;
    return events.filter((e: any) => e.status === "live").length;
  }, [events]);

  const handleSelectOdds = (event: any, outcome: any, marketKey: string) => {
    if (!isAuthenticated) return;
    addSelection({
      matchId: event.id,
      marketId: marketKey,
      oddsId: outcome.name,
      source: "live",
      label: outcome.name,
      marketName: marketKey === "h2h" ? "Match Winner" : marketKey === "spreads" ? "Point Spread" : "Total Points",
      matchName: `${event.homeTeam} vs ${event.awayTeam}`,
      oddsValue: outcome.price,
    });
    openBetSlip();
  };

  const getScoreDisplay = (event: any) => {
    if (event.homeScore !== undefined && event.awayScore !== undefined) {
      return `${event.homeScore} - ${event.awayScore}`;
    }
    return null;
  };

  if (sportsLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00e701]" />
      </div>
    );
  }

  if (sportsError && eventsError && (!wsEvents || wsEvents.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-gray-400 mb-4">Failed to load odds data</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#00e701] text-black rounded-lg font-semibold hover:bg-[#00c701]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Live Odds</h1>
          {wsConnected && (
            <span className="flex items-center gap-1 text-xs text-[#00e701]">
              <span className="w-2 h-2 bg-[#00e701] rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Powered by</span>
          <span className="text-sm font-semibold text-[#00e701]">The Odds API</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedSport(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !selectedSport
              ? "bg-[#00e701] text-black"
              : "bg-[#1a1a2e] text-gray-400 hover:text-white"
          }`}
        >
          All Sports
        </button>
        {sortedSports?.slice(0, 15).map((sport: any) => (
          <button
            key={sport.key}
            onClick={() => setSelectedSport(sport.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedSport === sport.key
                ? "bg-[#00e701] text-black"
                : "bg-[#1a1a2e] text-gray-400 hover:text-white"
            }`}
          >
            {sport.title}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mb-6">
        {["all", "live", "upcoming", "finished"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTab === tab
                ? "bg-[#1a1a2e] text-white border border-[#00e701]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab === "all" ? "All" : tab === "live" ? `Live${liveCount > 0 ? ` (${liveCount})` : ""}` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "live" && liveCount > 0 && (
              <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🏟️</div>
          <p className="text-gray-400 text-lg">No events available</p>
          <p className="text-gray-500 text-sm mt-2">
            {selectedTab === "live"
              ? "No live events right now"
              : selectedTab === "upcoming"
                ? "No upcoming events scheduled"
                : "Check back later for matches"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event: any) => (
            <div
              key={event.id}
              className="bg-[#1a1a2e] rounded-xl border border-[#2a2a3e] overflow-hidden"
            >
              <div className="px-5 py-3 flex items-center justify-between bg-[#141428]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[#00e701] uppercase tracking-wider">
                    {event.sportTitle}
                  </span>
                  {event.status === "live" && (
                    <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      LIVE
                    </span>
                  )}
                  {event.status === "finished" && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      FINISHED
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(event.commenceTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 text-right">
                    <p className="text-white font-semibold text-lg">{event.homeTeam}</p>
                  </div>
                  <div className="mx-6 flex flex-col items-center">
                    {event.homeScore !== undefined && event.awayScore !== undefined ? (
                      <span className={`text-2xl font-bold ${event.status === "live" ? "text-[#00e701]" : "text-gray-400"}`}>
                        {event.homeScore} - {event.awayScore}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm font-medium">VS</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-lg">{event.awayTeam}</p>
                  </div>
                </div>

                {event.bookmakers?.slice(0, 2).map((bm: any) => (
                  <div key={bm.key}>
                    {bm.markets.map((market: any) => (
                      <div key={market.key} className="mb-2">
                        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
                          {market.name}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {market.outcomes.map((outcome: any) => (
                            <button
                              key={`${outcome.name}-${outcome.price}`}
                              onClick={() => handleSelectOdds(event, outcome, market.key)}
                              disabled={!isAuthenticated || event.status === "finished"}
                              className="flex items-center gap-3 px-4 py-2.5 bg-[#0d0d1a] border border-[#2a2a3e] rounded-lg hover:border-[#00e701] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                {outcome.name}
                              </span>
                              <span className="text-sm font-bold text-[#00e701]">
                                {outcome.price.toFixed(2)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {!isAuthenticated && (
                  <div className="mt-3 text-center">
                    <Link
                      href="/login"
                      className="text-sm text-[#00e701] hover:underline"
                    >
                      Log in to place bets
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

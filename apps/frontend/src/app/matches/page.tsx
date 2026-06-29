"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveMatches, useUpcomingMatches, useMatches } from "@/hooks/useSports";
import { formatDate } from "@/lib/utils";
import { useBetSlipStore } from "@/store/betSlipStore";
import { useUIStore } from "@/store/uiStore";

export default function MatchesPage() {
  const [tab, setTab] = useState<"live" | "upcoming" | "all">("live");
  const [page, setPage] = useState(1);
  const { addSelection } = useBetSlipStore();
  const { openBetSlip } = useUIStore();

  const { data: liveData } = useLiveMatches();
  const { data: upcomingData } = useUpcomingMatches({ page, limit: 20 });
  const { data: allData } = useMatches({ page, limit: 20 });

  const liveMatches = liveData?.data || liveData || [];
  const upcomingMatches = upcomingData?.data?.data || upcomingData?.data || upcomingData || [];
  const allMatches = allData?.data?.data || allData?.data || allData || [];

  const meta = tab === "upcoming"
    ? (upcomingData?.data?.meta || upcomingData?.meta)
    : tab === "all"
    ? (allData?.data?.meta || allData?.meta)
    : null;

  const matches = tab === "live" ? liveMatches : tab === "upcoming" ? upcomingMatches : allMatches;
  const totalPages = meta?.totalPages || 1;

  const addToSlip = (odds: any, matchId: string, matchName: string, marketId: string, marketName: string) => {
    if (!odds?.id) return;
    addSelection({ matchId, marketId, oddsId: odds.id, label: odds.label, oddsValue: Number(odds.value), matchName, marketName });
    openBetSlip();
  };

  const tabs = [
    { key: "live" as const, label: "Live", count: liveMatches.length },
    { key: "upcoming" as const, label: "Upcoming" },
    { key: "all" as const, label: "All" },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); if (t.key !== "live") setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-[#00e701] text-black"
                : "bg-[#1a2c38] text-[#8a9bb0] hover:text-white border border-[#2a3c48]"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && tab === "live" && (
              <span className="ml-1.5 text-xs opacity-80">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Live empty state */}
      {tab === "live" && liveMatches.length === 0 && (
        <div className="rounded-lg bg-[#1a2c38] border border-[#2a3c48] p-6 text-center">
          <p className="text-sm text-[#8a9bb0]">No live matches right now</p>
          <button
            onClick={() => setTab("upcoming")}
            className="mt-3 text-sm font-medium text-[#00e701] hover:text-[#00e701]/80 transition-colors"
          >
            View upcoming matches
          </button>
        </div>
      )}

      {/* Match List */}
      <div className="space-y-2">
        {matches.length > 0 ? (
          matches.map((match: any) => {
            const isLive = match.status === "LIVE";
            const isFinished = match.status === "FINISHED";
            const matchName = `${match.homeTeam?.name || "?"} vs ${match.awayTeam?.name || "?"}`;
            const firstMarketOdds = match.markets?.[0]?.odds?.filter((o: any) => o.type === "BACK")?.slice(0, 2) || [];
            return (
              <Link
                key={match.id}
                href={isLive ? `/match-center/${match.id}` : `/match/${match.id}`}
                className="flex items-center gap-3 rounded-lg bg-[#1a2c38] border border-[#2a3c48] px-4 py-3 hover:border-[#00e701]/40 hover:bg-[#1a2c38]/80 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-[#6b7280] mb-0.5">
                    <span>{match.league?.name}</span>
                    <span>·</span>
                    <span>{match.league?.sport?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#d1d5db] truncate">{match.homeTeam?.shortName || match.homeTeam?.name}</span>
                    {!isFinished && (match.homeScore !== null) ? (
                      <span className="text-sm font-bold text-white tabular-nums">{match.homeScore}{match.homeWickets !== null ? `/${match.homeWickets}` : ""}</span>
                    ) : isFinished && match.homeScore !== null ? (
                      <span className="text-sm font-bold text-[#6b7280] tabular-nums">{match.homeScore} - {match.awayScore}</span>
                    ) : (
                      <span className="text-xs text-[#6b7280]">vs</span>
                    )}
                    <span className="text-sm font-medium text-[#d1d5db] truncate">{match.awayTeam?.shortName || match.awayTeam?.name}</span>
                  </div>
                  {match.homeOvers !== null && isLive && (
                    <div className="text-[11px] text-[#6b7280] mt-0.5">Overs: {match.homeOvers}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {firstMarketOdds.map((o: any) => (
                    <button
                      key={o.id}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToSlip(o, match.id, matchName, match.markets[0].id, match.markets[0].name); }}
                      className="flex flex-col items-center rounded bg-[#0f212e] px-3 py-1.5 min-w-[60px] hover:bg-[#00e701]/10 border border-transparent hover:border-[#00e701]/30 transition-all"
                    >
                      <span className="text-[10px] text-[#6b7280] leading-tight">{o.label}</span>
                      <span className="text-sm font-bold text-[#00e701]">{Number(o.value).toFixed(2)}</span>
                    </button>
                  ))}
                  {isLive && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#00e701] ml-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00e701] animate-pulse" />
                      LIVE
                    </span>
                  )}
                  {isFinished && (
                    <span className="text-xs text-[#6b7280] ml-1">FIN</span>
                  )}
                  {!isLive && !isFinished && (
                    <span className="text-[11px] text-[#6b7280] ml-1 whitespace-nowrap">{formatDate(match.startTime)}</span>
                  )}
                </div>
              </Link>
            );
          })
        ) : tab !== "live" ? (
          <div className="rounded-lg bg-[#1a2c38] border border-[#2a3c48] p-8 text-center text-[#6b7280]">No matches found</div>
        ) : null}
      </div>

      {/* Pagination */}
      {totalPages > 1 && tab !== "live" && (
        <div className="mt-6 flex justify-center gap-1.5">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`rounded px-3 py-1 text-sm transition-all ${
                page === i + 1
                  ? "bg-[#00e701] text-black font-medium"
                  : "bg-[#1a2c38] text-[#6b7280] hover:text-white border border-[#2a3c48]"
              }`}
            >{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSports, useMatches } from "@/hooks/useSports";
import { formatDate } from "@/lib/utils";
import { PromotionCard } from "@/components/sports";
import { useBetSlipStore } from "@/store/betSlipStore";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

const SPORT_ICONS: Record<string, string> = {
  cricket: "\u{1F3CF}", football: "\u26BD", tennis: "\u{1F3BE}", basketball: "\u{1F3C0}",
  baseball: "\u26BE", hockey: "\u{1F3D2}", rugby: "\u{1F3C9}", boxing: "\u{1F94A}", mma: "\u{1F94B}", golf: "\u26F3",
};

export default function SportsPage() {
  const { data: sportsData } = useSports();
  const { data: matchesData } = useMatches({ limit: 50 });
  const { addSelection } = useBetSlipStore();
  const { openBetSlip } = useUIStore();
  const { isAuthenticated } = useAuthStore();

  const sports = sportsData?.data || sportsData || [];
  const matches = matchesData?.data?.data || matchesData?.data || matchesData || [];

  const sportCounts: Record<string, { live: number; upcoming: number }> = {};
  for (const m of matches) {
    const slug = m.league?.sport?.slug || m.league?.name?.toLowerCase();
    if (!sportCounts[slug]) sportCounts[slug] = { live: 0, upcoming: 0 };
    if (m.status === "LIVE") sportCounts[slug].live++;
    else if (m.status === "SCHEDULED") sportCounts[slug].upcoming++;
  }

  // DEBUG: Remove after verifying production API works
  useEffect(() => {
    console.log("[DEBUG] BACKEND_URL:", process.env.BACKEND_URL || "NOT SET (defaults to localhost:4000)");
    console.log("[DEBUG] NEXT_PUBLIC_WS_URL:", process.env.NEXT_PUBLIC_WS_URL || "NOT SET");
    console.log("[DEBUG] Sports response:", sportsData);
    console.log("[DEBUG] Matches response:", matchesData);
  }, [sportsData, matchesData]);

  const addToSlip = (odds: any, matchId: string, matchName: string, marketId: string, marketName: string) => {
    if (!odds?.id) return;
    addSelection({ matchId, marketId, oddsId: odds.id, label: odds.label, oddsValue: Number(odds.value), matchName, marketName });
    openBetSlip();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Promotions */}
      <PromotionCard
        title="Cricket Season is Here"
        description="Bet on international T20 and Test matches with the best odds on the platform."
        badge="LIVE"
        cta="View Matches"
        ctaLink="/matches"
      />

      {/* Sports Grid */}
      <div>
        <h1 className="mb-4 text-xl font-bold text-white">Sports</h1>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.isArray(sports) && sports.map((sport: any) => {
            const counts = sportCounts[sport.slug] || sportCounts[sport.name?.toLowerCase()] || { live: 0, upcoming: 0 };
            return (
              <Link
                key={sport.id}
                href={`/sports/${sport.slug}`}
                className="flex flex-col items-center gap-1.5 rounded-lg bg-[#1a2c38] border border-[#2a3c48] p-4 hover:border-[#00e701] hover:bg-[#1a2c38]/80 transition-all active:scale-[0.97]"
              >
                <span className="text-2xl">{SPORT_ICONS[sport.slug] || sport.icon || "\u{1F3C6}"}</span>
                <span className="text-sm font-medium text-[#d1d5db] text-center leading-tight">{sport.name}</span>
                {counts.live > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-[#00e701] font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00e701]" />
                    {counts.live} LIVE
                  </span>
                )}
                {counts.live === 0 && counts.upcoming === 0 && (
                  <span className="text-[11px] text-[#6b7280]">{sport._count?.leagues || 0} leagues</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* All Matches */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">All Matches</h2>
          <Link href="/matches" className="text-sm font-medium text-[#00e701] hover:text-[#00e701]/80 transition-colors">View All</Link>
        </div>
        {matches.length > 0 ? (
          <div className="space-y-2">
            {matches.slice(0, 12).map((match: any) => {
              const matchName = `${match.homeTeam?.name || "?"} vs ${match.awayTeam?.name || "?"}`;
              const isLive = match.status === "LIVE";
              const isFinished = match.status === "FINISHED";
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
            })}
          </div>
        ) : (
          <div className="rounded-lg bg-[#1a2c38] border border-[#2a3c48] p-8 text-center text-[#6b7280]">No matches available</div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMatch } from "@/hooks/useSports";
import { useBetSlipStore } from "@/store/betSlipStore";
import { useUIStore } from "@/store/uiStore";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function MatchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = useMatch(id);
  const { addSelection } = useBetSlipStore();
  const { openBetSlip } = useUIStore();

  const match = data?.data || data;

  if (isLoading) {
    return <div className="mx-auto max-w-5xl"><div className="card animate-pulse p-8 text-center text-[#6b7280]">Loading match details...</div></div>;
  }

  if (!match) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-white">Match not found</h1>
        <Link href="/sports" className="text-cyan-400 hover:text-cyan-300">← Back to sports</Link>
      </div>
    );
  }

  const handleSelectOdds = (odds: any, market: any) => {
    addSelection({
      matchId: match.id,
      marketId: market.id,
      oddsId: odds.id,
      label: odds.label,
      oddsValue: Number(odds.value),
      matchName: `${match.homeTeam?.name} vs ${match.awayTeam?.name}`,
      marketName: market.name,
    });
    openBetSlip();
  };

  const isLive = match.status === "LIVE";

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/matches" className="mb-3 inline-block text-sm text-cyan-400 hover:text-cyan-300">← All Matches</Link>

      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="text-xs text-[#6b7280] mb-1">{match.league?.name}</div>
            <div className="text-lg font-semibold text-white">{match.homeTeam?.name}</div>
            {(isLive || match.homeScore !== null) && (
              <div className="mt-1">
                <span className="text-3xl font-bold text-white">{match.homeScore ?? "-"}</span>
                {match.homeWickets !== null && match.homeWickets !== undefined && (
                  <span className="text-xl text-[#6b7280] ml-0.5">/{match.homeWickets}</span>
                )}
              </div>
            )}
            {match.homeOvers !== null && <div className="text-xs text-[#6b7280]">Overs: {match.homeOvers}</div>}
          </div>

          <div className="px-6 text-center">
            <div className={`text-sm font-semibold ${isLive ? "text-green-400" : "text-[#6b7280]"}`}>
              {isLive ? "● LIVE" : match.status}
            </div>
            {!isLive && <div className="mt-1 text-xs text-[#6b7280]">{formatDate(match.startTime)}</div>}
            <div className="mt-2 text-xs text-[#6b7280]">VS</div>
          </div>

          <div className="flex-1 text-center">
            <div className="text-xs text-[#6b7280] mb-1">{match.league?.name}</div>
            <div className="text-lg font-semibold text-white">{match.awayTeam?.name}</div>
            {(isLive || match.awayScore !== null) && (
              <div className="mt-1">
                <span className="text-3xl font-bold text-white">{match.awayScore ?? "-"}</span>
                {match.awayWickets !== null && match.awayWickets !== undefined && (
                  <span className="text-xl text-[#6b7280] ml-0.5">/{match.awayWickets}</span>
                )}
              </div>
            )}
            {match.awayOvers !== null && <div className="text-xs text-[#6b7280]">Overs: {match.awayOvers}</div>}
          </div>
        </div>

        {isLive && (
          <div className="mt-4 flex justify-center gap-6 border-t border-slate-700/50 pt-3 text-xs text-[#9ca3af]">
            {match.currentRr !== null && match.currentRr !== undefined && <span>CRR: {Number(match.currentRr).toFixed(2)}</span>}
            {match.requiredRr !== null && match.requiredRr !== undefined && match.requiredRr > 0 && <span>Req RR: {Number(match.requiredRr).toFixed(2)}</span>}
            {match.partnership && <span>Partnership: {(match.partnership as any).runs || 0} runs ({(match.partnership as any).balls || 0} balls)</span>}
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Markets & Odds</h2>
        <div className="flex items-center gap-3 text-xs text-[#9ca3af]">
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-6 rounded bg-green-400" /> BACK</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-6 rounded bg-pink-700" /> LAY</span>
        </div>
      </div>

      {match.markets && match.markets.length > 0 ? (
        <div className="space-y-4">
          {match.markets.map((market: any) => {
            const backOdds = (market.odds || []).filter((o: any) => o.type === "BACK");
            const layOdds = (market.odds || []).filter((o: any) => o.type === "LAY");

            return (
              <div key={market.id} className="card">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">{market.name}</h3>
                    <span className="text-xs text-[#6b7280]">{market.type.replace(/_/g, " ")}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    market.status === "OPEN" ? "bg-green-400/20 text-green-400" :
                    market.status === "SUSPENDED" ? "bg-amber-500/20 text-amber-400" :
                    "bg-gray-500/20 text-slate-400"
                  }`}>{market.status}</span>
                </div>

                <div className="space-y-1">
                  {Array.from(new Set([...backOdds, ...layOdds].map((o: any) => o.label))).map((label: string) => {
                    const back = backOdds.find((o: any) => o.label === label);
                    const lay = layOdds.find((o: any) => o.label === label);
                    return (
                      <div key={label as string} className="flex items-center justify-between rounded-md bg-[#2a2a2a] px-3 py-2 hover:bg-slate-700 transition-colors">
                        <span className="flex-1 text-sm font-medium text-[#d1d5db]">{label as string}</span>
                        {back && (
                          <button
                            onClick={() => handleSelectOdds(back, market)}
                            disabled={!back.active || market.status !== "OPEN"}
                            className="mx-1 flex min-w-[80px] flex-col items-center rounded bg-green-400 px-3 py-1 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <span className="text-xs text-green-200">{back.liquidity ? `$${formatCurrency(back.liquidity)}` : ""}</span>
                            <span className="font-bold text-white">{Number(back.value).toFixed(2)}</span>
                          </button>
                        )}
                        {lay && (
                          <button
                            onClick={() => handleSelectOdds(lay, market)}
                            disabled={!lay.active || market.status !== "OPEN"}
                            className="mx-1 flex min-w-[80px] flex-col items-center rounded bg-pink-700 px-3 py-1 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <span className="text-xs text-pink-200">{lay.liquidity ? `$${formatCurrency(lay.liquidity)}` : ""}</span>
                            <span className="font-bold text-white">{Number(lay.value).toFixed(2)}</span>
                          </button>
                        )}
                        {!back && !lay && <span className="text-xs text-[#6b7280]">No odds</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center text-[#6b7280]">No markets available for this match</div>
      )}

      {isLive && (
        <div className="mt-4 text-center">
          <Link
            href={`/match-center/${match.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-green-400 px-6 py-3 font-semibold text-white hover:brightness-110 transition-all"
          >
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Open Live Match Center
          </Link>
        </div>
      )}
    </div>
  );
}

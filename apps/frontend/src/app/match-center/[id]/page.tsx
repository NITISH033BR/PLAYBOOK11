"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { useBetSlipStore } from "@/store/betSlipStore";
import { useUIStore } from "@/store/uiStore";
import { formatCurrency } from "@/lib/utils";

export default function MatchCenterPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: match, connected } = useLiveMatch(id);
  const { addSelection } = useBetSlipStore();
  const { openBetSlip } = useUIStore();

  if (!match) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="card animate-pulse p-12 text-center">
          <div className="text-xl text-[#6b7280]">Connecting to match center...</div>
          <div className="mt-2 text-sm text-[#6b7280]">Establishing live feed</div>
        </div>
      </div>
    );
  }

  const isLive = match.status === "LIVE";
  const batsmen = match.batsmen ? (Array.isArray(match.batsmen) ? match.batsmen : [match.batsmen]) : [];
  const bowlerData = match.bowler as any || null;
  const partnershipData = match.partnership as any || null;
  const lastWicket = match.lastWicket as any || null;
  const currentOver = match.currentOver as any || null;
  const events = match.events ? (Array.isArray(match.events) ? match.events : []) : [];
  const commentaryData = match.commentary ? (Array.isArray(match.commentary) ? match.commentary : []) : [];

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

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/matches" className="text-sm text-cyan-400 hover:text-cyan-300">← All Matches</Link>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-xs text-[#6b7280]">{connected ? "Live" : "Reconnecting..."}</span>
          {isLive && <span className="rounded bg-green-400/20 px-2 py-0.5 text-xs font-semibold text-green-400">● LIVE</span>}
        </div>
      </div>

      <div className="card mb-4">
        <div className="grid grid-cols-7 gap-4">
          <div className="col-span-3 text-center">
            <div className="text-xs text-[#6b7280] mb-1">{match.league?.name}</div>
            <div className="flex items-center justify-center gap-2">
              <div className="text-right">
                <div className="text-lg font-semibold text-white">{match.homeTeam?.name}</div>
                <div className="text-xs text-[#9ca3af]">{match.homeTeam?.shortName}</div>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-5xl font-bold tracking-tight text-white">{match.homeScore ?? 0}</span>
              {match.homeWickets !== null && match.homeWickets !== undefined && (
                <span className="text-2xl text-[#6b7280] ml-1">/{match.homeWickets}</span>
              )}
            </div>
            {match.homeOvers !== null && match.homeOvers !== undefined && (
              <div className="mt-1 text-sm text-[#6b7280]">Overs: {match.homeOvers}</div>
            )}
          </div>

          <div className="col-span-1 flex flex-col items-center justify-center">
            <div className="text-xs text-[#6b7280]">VS</div>
            {isLive && (
              <>
                <div className="mt-2 text-xs text-[#6b7280]">Innings {match.innings ?? 1}</div>
                {match.currentRr !== null && match.currentRr !== undefined && (
                  <div className="mt-2 text-center">
                    <div className="text-xs text-[#6b7280]">CRR</div>
                    <div className="text-lg font-bold text-cyan-400">{Number(match.currentRr).toFixed(2)}</div>
                  </div>
                )}
                {match.requiredRr !== null && match.requiredRr !== undefined && match.requiredRr > 0 && (
                  <div className="mt-2 text-center">
                    <div className="text-xs text-[#6b7280]">Req RR</div>
                    <div className="text-lg font-bold text-red-400">{Number(match.requiredRr).toFixed(2)}</div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="col-span-3 text-center">
            <div className="text-xs text-[#6b7280] mb-1">{match.league?.name}</div>
            <div className="flex items-center justify-center gap-2">
              <div className="text-left">
                <div className="text-lg font-semibold text-white">{match.awayTeam?.name}</div>
                <div className="text-xs text-[#9ca3af]">{match.awayTeam?.shortName}</div>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-5xl font-bold tracking-tight text-white">{match.awayScore ?? 0}</span>
              {match.awayWickets !== null && match.awayWickets !== undefined && (
                <span className="text-2xl text-[#6b7280] ml-1">/{match.awayWickets}</span>
              )}
            </div>
            {match.awayOvers !== null && match.awayOvers !== undefined && (
              <div className="mt-1 text-sm text-[#6b7280]">Overs: {match.awayOvers}</div>
            )}
          </div>
        </div>

        {isLive && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-slate-700/50 pt-4 text-xs">
            {partnershipData && (
              <div className="text-center">
                <div className="text-[#6b7280]">Partnership</div>
                <div className="font-semibold text-white">{partnershipData.runs || 0} runs ({partnershipData.balls || 0} balls)</div>
              </div>
            )}
            {lastWicket && (
              <div className="text-center">
                <div className="text-[#6b7280]">Last Wicket</div>
                <div className="font-semibold text-red-400">{lastWicket.name || ""} {lastWicket.runs ?? ""}{lastWicket.balls ? ` (${lastWicket.balls})` : ""}</div>
              </div>
            )}
            {currentOver && (
              <div className="text-center">
                <div className="text-[#6b7280]">Current Over</div>
                <div className="font-semibold text-white">{currentOver.balls ? currentOver.balls.join(" ") : ""} {currentOver.runs !== undefined ? `(${currentOver.runs} runs)` : ""}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {isLive && (
        <div className="mb-4 grid gap-4 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Batsmen</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-xs text-[#6b7280]">
                    <th className="pb-2 text-left">Batter</th>
                    <th className="pb-2 text-right">R</th>
                    <th className="pb-2 text-right">B</th>
                    <th className="pb-2 text-right">4s</th>
                    <th className="pb-2 text-right">6s</th>
                    <th className="pb-2 text-right">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {batsmen.length > 0 ? batsmen.map((b: any, i: number) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-2">
                        <span className="font-medium text-amber-400">{b.name}</span>
                        {i === 0 && <span className="ml-1 text-xs text-[#6b7280]">*</span>}
                      </td>
                      <td className="py-2 text-right font-bold text-white">{b.runs ?? 0}</td>
                      <td className="py-2 text-right text-[#6b7280]">{b.balls ?? 0}</td>
                      <td className="py-2 text-right text-green-400">{b.fours ?? 0}</td>
                      <td className="py-2 text-right text-cyan-400">{b.sixes ?? 0}</td>
                      <td className="py-2 text-right text-[#d1d5db]">{Number(b.balls) > 0 ? (Number(b.runs) / Number(b.balls) * 100).toFixed(1) : "0.0"}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="py-4 text-center text-[#6b7280]">No batting data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Bowling</h3>
              {bowlerData ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50 text-xs text-[#6b7280]">
                        <th className="pb-2 text-left">Bowler</th>
                        <th className="pb-2 text-right">O</th>
                        <th className="pb-2 text-right">M</th>
                        <th className="pb-2 text-right">R</th>
                        <th className="pb-2 text-right">W</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 font-medium text-amber-400">{bowlerData.name || ""}</td>
                        <td className="py-2 text-right text-white">{bowlerData.overs || "0.0"}</td>
                        <td className="py-2 text-right text-[#6b7280]">{bowlerData.maidens ?? 0}</td>
                        <td className="py-2 text-right text-white">{bowlerData.runs ?? 0}</td>
                        <td className="py-2 text-right font-bold text-green-400">{bowlerData.wickets ?? 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-[#6b7280]">No bowling data</div>
              )}
            </div>

            <div className="card">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Partnership</h3>
              {partnershipData ? (
                <div>
                  <div className="text-2xl font-bold text-white">{partnershipData.runs || 0}</div>
                  <div className="text-sm text-[#9ca3af]">runs</div>
                  <div className="mt-2 text-sm text-[#6b7280]">{partnershipData.balls || 0} balls</div>
                </div>
              ) : (
                <div className="text-sm text-[#6b7280]">Yet to bat</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isLive && events.length > 0 && (
        <div className="card mb-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Match Events</h3>
          <div className="flex flex-wrap gap-2">
            {events.map((e: any, i: number) => (
              <span key={i} className={`rounded-full px-3 py-1 text-xs font-medium ${
                e.type === "WICKET" ? "bg-red-500/20 text-red-400" :
                e.type === "BOUNDARY" ? "bg-green-400/20 text-green-400" :
                e.type === "SIX" ? "bg-cyan-600/20 text-cyan-400" :
                "bg-gray-500/20 text-slate-400"
              }`}>
                {e.type}{e.player ? `: ${e.player}` : ""}{e.runs !== undefined ? ` +${e.runs}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {isLive && commentaryData.length > 0 && (
        <div className="card mb-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Live Commentary</h3>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {commentaryData.map((c: any, i: number) => (
              <div key={i} className="flex gap-3 rounded-md bg-[#2a2a2a] p-2 text-sm">
                <span className="shrink-0 text-xs text-[#6b7280]">{c.over || ""}</span>
                <span className="text-[#d1d5db]">{c.text || ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-white">Betting Markets</h2>

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
                    market.status === "SUSPENDED" ? "bg-amber-500/20 text-amber-400" : "bg-gray-500/20 text-slate-400"
                  }`}>
                    {market.status === "OPEN" ? "OPEN" : market.status === "SUSPENDED" ? "SUSPENDED" : "SETTLED"}
                  </span>
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
                            className="mx-1 flex min-w-[90px] flex-col items-center rounded bg-green-400 px-3 py-1.5 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <span className="text-[10px] text-green-200">
                              {back.liquidity && Number(back.liquidity) > 0 ? `$${formatCurrency(back.liquidity)}` : ""}
                            </span>
                            <span className="font-bold text-white">{Number(back.value).toFixed(2)}</span>
                          </button>
                        )}
                        {lay && (
                          <button
                            onClick={() => handleSelectOdds(lay, market)}
                            disabled={!lay.active || market.status !== "OPEN"}
                            className="mx-1 flex min-w-[90px] flex-col items-center rounded bg-pink-700 px-3 py-1.5 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <span className="text-[10px] text-pink-300">
                              {lay.liquidity && Number(lay.liquidity) > 0 ? `$${formatCurrency(lay.liquidity)}` : ""}
                            </span>
                            <span className="font-bold text-white">{Number(lay.value).toFixed(2)}</span>
                          </button>
                        )}
                        {!back && !lay && <span className="text-xs text-[#6b7280]">—</span>}
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

      {!isLive && (
        <div className="mt-6 text-center text-sm text-[#6b7280]">
          Match is {match.status.toLowerCase()}. Live match center only available for live matches.
        </div>
      )}
    </div>
  );
}

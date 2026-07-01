"use client";

import Link from "next/link";
import { useSports, useLiveMatches, useUpcomingMatches } from "@/hooks/useSports";
import { useAuthStore } from "@/store/authStore";
import { useBetSlipStore } from "@/store/betSlipStore";
import { useUIStore } from "@/store/uiStore";
import { useTrendingBets, useFeaturedMarkets, useRecentWinners, useTopWinners, useHomeSummary } from "@/hooks/useHome";
import { useFeaturedCasinoGames, useCasinoPromotions } from "@/hooks/useCasino";
import { useCasinoCategories } from "@/hooks/useCasino";
import { formatDate, formatCurrency } from "@/lib/utils";
import { GameCard } from "@/components/casino/GameCard";
import { useWallet } from "@/hooks/useWallet";
import { motion } from "framer-motion";
import { useMemo } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const { addSelection } = useBetSlipStore();
  const { openBetSlip } = useUIStore();
  const { data: walletData } = useWallet();
  const wallet = walletData?.data || walletData;

  const { data: sportsData } = useSports();
  const { data: liveData } = useLiveMatches();
  const { data: upcomingData } = useUpcomingMatches({ limit: 6 });
  const { data: trendingData } = useTrendingBets(8);
  const { data: featuredData } = useFeaturedMarkets(6);
  const { data: winnersData } = useRecentWinners(8);
  const { data: topWinnersData } = useTopWinners(3);
  const { data: summaryData } = useHomeSummary();
  const { data: featuredCasinoData } = useFeaturedCasinoGames(8);
  const { data: promoData } = useCasinoPromotions();
  const { data: casinoCategoriesData } = useCasinoCategories();

  const sports = useMemo(() => sportsData?.data || sportsData || [], [sportsData]);
  const liveMatches = useMemo(() => liveData?.data || liveData || [], [liveData]);
  const upcomingMatches = useMemo(() => upcomingData?.data?.data || upcomingData?.data || upcomingData || [], [upcomingData]);
  const trendingBets = useMemo(() => trendingData?.data || trendingData || [], [trendingData]);
  const featuredMarkets = useMemo(() => featuredData?.data || featuredData || [], [featuredData]);
  const recentWinners = useMemo(() => winnersData?.data || winnersData || [], [winnersData]);
  const topWinners = useMemo(() => topWinnersData?.data || topWinnersData || [], [topWinnersData]);
  const summary = useMemo(() => summaryData?.data || summaryData || { liveCount: 0, upcomingCount: 0, sportCount: 0, totalUsers: 0, activeBets: 0 }, [summaryData]);
  const featuredCasino = useMemo(() => featuredCasinoData?.data || featuredCasinoData || [], [featuredCasinoData]);
  const promotions = useMemo(() => promoData?.data || promoData || [], [promoData]);
  const casinoCategories = useMemo(() => casinoCategoriesData?.data || casinoCategoriesData || [], [casinoCategoriesData]);

  const availableBalance = Math.max(0, Number(wallet?.balance || 0) - Number(wallet?.locked || 0));

  const addToSlip = (odds: any, matchId: string, matchName: string, marketId: string, marketName: string) => {
    if (!odds?.id) return;
    addSelection({
      matchId,
      marketId,
      oddsId: odds.id,
      label: odds.label,
      oddsValue: Number(odds.value),
      matchName,
      marketName,
    });
    openBetSlip();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.div className="mx-auto max-w-7xl" initial="initial" animate="animate" variants={stagger}>
      {/* HERO BANNER */}
      <motion.section variants={fadeUp} className="mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0B1220] p-6 md:p-8 lg:p-12 border border-[#00D4FF]/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00D4FF]/15 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <motion.h1 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tight" variants={fadeUp}>
              <span className="text-white">Welcome Back</span>
              {isAuthenticated && (
                <span className="bg-gradient-to-r from-[#00D4FF] to-cyan-300 bg-clip-text text-transparent">, {user?.displayName || user?.username}</span>
              )}
            </motion.h1>
            <motion.p className="mt-2 text-sm sm:text-lg text-slate-400 max-w-xl" variants={fadeUp}>
              Premium sportsbook & casino experience
            </motion.p>
            <motion.div className="mt-6 md:mt-8 flex flex-wrap gap-2 sm:gap-3" variants={fadeUp}>
              <Link href="/wallet" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00D4FF] px-5 sm:px-6 py-3 font-semibold text-black hover:bg-[#00D4FF]/90 transition-all shadow-lg shadow-[#00D4FF]/25 active:scale-[0.98] flex-1 sm:flex-none">
                <span>💰</span>
                <span className="hidden xs:inline">Deposit Funds</span>
                <span className="xs:hidden">Deposit</span>
              </Link>
              <Link href="/wallet?tab=withdraw" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-5 sm:px-6 py-3 font-semibold text-slate-300 hover:bg-[#172033] hover:text-white transition-all active:scale-[0.98] flex-1 sm:flex-none">
                <span>💸</span>
                <span className="hidden xs:inline">Withdraw</span>
                <span className="xs:hidden">Withdraw</span>
              </Link>
              <Link href="/matches" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172033]/80 px-5 sm:px-6 py-3 font-semibold text-white hover:bg-[#172033] transition-all active:scale-[0.98] flex-1 sm:flex-none">
                <span>📺</span>
                View Matches
              </Link>
              <button onClick={openBetSlip} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#00D4FF]/20 px-5 sm:px-6 py-3 font-semibold text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all active:scale-[0.98] flex-1 sm:flex-none">
                <span>🎫</span>
                Bet Slip
              </button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* STATS */}
      <motion.section variants={fadeUp} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Balance", value: isAuthenticated ? `$${formatCurrency(availableBalance)}` : "$0.00", icon: "💰", color: "from-[#00D4FF] to-cyan-700" },
          { label: "Active Bets", value: summary.activeBets, icon: "🎫", color: "from-green-500 to-green-700" },
          { label: "Live Matches", value: summary.liveCount, icon: "🔴", color: "from-rose-500 to-rose-700" },
          { label: "Total Winnings", value: `$${formatCurrency(summary.totalUsers || 0)}`, icon: "🏆", color: "from-amber-500 to-amber-700" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className="relative overflow-hidden rounded-xl bg-[#111827]/80 border border-slate-700/30 p-5 hover:border-slate-600/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">{stat.label}</div>
                <div className="mt-1.5 text-2xl font-bold text-white">{stat.value}</div>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                <span className="text-lg">{stat.icon}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.section>

      {/* PROMOTIONS */}
      {promotions.length > 0 && (
        <motion.section variants={fadeUp} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔥</span>
            <h2 className="text-xl font-bold text-white">Hot Promotions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.slice(0, 3).map((p: any, i: number) => (
              <motion.div
                key={p.id}
                variants={fadeUp}
                className="group relative overflow-hidden rounded-xl bg-[#111827]/80 border border-slate-700/30 p-6 transition-all duration-300 hover:border-[#00D4FF]/30 hover:shadow-lg hover:shadow-[#00D4FF]/10 hover:-translate-y-0.5"
              >
                {p.badge && (
                  <span className="absolute right-3 top-3 rounded-full bg-[#00D4FF] px-2.5 py-0.5 text-[10px] font-bold text-black">
                    {p.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{p.description}</p>
                <Link href="/casino" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors">
                  Claim Now
                  <span>→</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* WINNERS TICKER */}
      {recentWinners.length > 0 && (
        <motion.section variants={fadeUp} className="mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-[#00D4FF]/10 to-green-500/10 border border-[#00D4FF]/10">
          <div className="flex items-center gap-4 px-5 py-3">
            <span className="shrink-0 text-sm font-bold text-[#00D4FF] uppercase tracking-wider">🏆 Winners</span>
            <div className="flex gap-8 overflow-hidden">
              {recentWinners.slice(0, 5).map((w: any, i: number) => (
                <span key={w.id || i} className="shrink-0 text-sm text-slate-400">
                  {w.username} won <span className="font-bold text-green-400">${formatCurrency(w.amount)}</span> ({timeAgo(w.settledAt)})
                </span>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* LIVE MATCHES */}
      {liveMatches.length > 0 && (
        <motion.section variants={fadeUp} className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
              </span>
              <h2 className="text-xl font-bold text-white">
                Live Matches
                <span className="ml-2 text-sm font-normal text-slate-500">({liveMatches.length})</span>
              </h2>
            </div>
            <Link href="/matches" className="text-sm text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors">View All →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {liveMatches.map((match: any) => {
              const matchName = `${match.homeTeam?.name || "?"} vs ${match.awayTeam?.name || "?"}`;
              const firstMarketOdds = match.markets?.[0]?.odds?.filter((o: any) => o.type === "BACK")?.slice(0, 2) || [];
              return (
                <motion.div key={match.id} variants={fadeUp}>
                  <Link href={`/match-center/${match.id}`} className="card-hover block">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{match.league?.name}</span>
                      <span className="flex items-center gap-1 font-semibold text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        LIVE
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm font-medium text-slate-300">{match.homeTeam?.shortName || match.homeTeam?.name}</span>
                      <span className="text-lg font-bold text-white">{match.homeScore ?? "-"}{match.homeWickets !== null && match.homeWickets !== undefined ? `/${match.homeWickets}` : ""}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm font-medium text-slate-300">{match.awayTeam?.shortName || match.awayTeam?.name}</span>
                      <span className="text-lg font-bold text-white">{match.awayScore ?? "-"}{match.awayWickets !== null && match.awayWickets !== undefined ? `/${match.awayWickets}` : ""}</span>
                    </div>
                    {match.homeOvers !== null && <div className="mt-1 text-xs text-slate-500">Overs: {match.homeOvers}</div>}
                    {firstMarketOdds.length > 0 && (
                      <div className="mt-3 flex gap-2 border-t border-slate-700/30 pt-3">
                        {firstMarketOdds.map((o: any) => (
                          <button key={o.id}
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); addToSlip(o, match.id, matchName, match.markets[0].id, match.markets[0].name); }}
                            className="odds-btn flex-1"
                          >
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">{o.label}</span>
                            <span className="text-sm font-bold text-[#00D4FF]">{Number(o.value).toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* FEATURED CASINO */}
      {featuredCasino.length > 0 && (
        <motion.section variants={fadeUp} className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">🎰 Featured Casino Games</h2>
            <Link href="/casino" className="text-sm text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors">View All →</Link>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {featuredCasino.slice(0, 8).map((game: any) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </motion.section>
      )}

      {/* CASINO CATEGORIES */}
      {casinoCategories.length > 0 && (
        <motion.section variants={fadeUp} className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-white">Casino Categories</h2>
          <div className="flex flex-wrap gap-2">
            {casinoCategories.map((cat: any) => (
              <Link key={cat.id} href={`/casino?category=${cat.slug}`}
                className="group flex items-center gap-2 rounded-xl bg-[#111827]/80 border border-slate-700/30 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-[#172033] hover:border-[#00D4FF]/30 hover:text-white transition-all"
              >
                <span className="text-lg">{cat.icon || "🎰"}</span>
                <span>{cat.name}</span>
                <span className="text-xs text-slate-500">({cat._count?.games || 0})</span>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* TRENDING BETS */}
      {trendingBets.length > 0 && (
        <motion.section variants={fadeUp} className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-white">Trending Bets</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trendingBets.map((bet: any, i: number) => (
              <motion.div key={bet.id || i} variants={fadeUp} className="card-hover">
                <div className="text-xs text-slate-500 truncate">{bet.matchName}</div>
                <div className="mt-1 text-sm font-medium text-white truncate">{bet.marketName}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-slate-400 truncate">{bet.selection}</span>
                  <button
                    onClick={() => addToSlip({ id: bet.id, label: bet.selection, value: bet.odds }, bet.matchId, bet.matchName, "", bet.marketName)}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-green-500 transition-all active:scale-95 shadow-lg shadow-green-500/20"
                  >{Number(bet.odds).toFixed(2)}</button>
                </div>
                <div className="mt-1.5 text-[10px] text-slate-500">Stake: ${formatCurrency(bet.stake)}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* FEATURED MARKETS */}
      {featuredMarkets.length > 0 && (
        <motion.section variants={fadeUp} className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-white">Featured Markets</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredMarkets.map((m: any, i: number) => {
              const backOdds = (m.odds || []).filter((o: any) => o.type === "BACK");
              return (
                <motion.div key={m.id || i} variants={fadeUp} className="card-hover">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#00D4FF]">{m.sport}</span>
                    <span className="text-xs text-slate-500">{m.league}</span>
                  </div>
                  <h3 className="mb-1 font-semibold text-sm text-white">{m.matchName}</h3>
                  <div className="text-xs text-slate-500 mb-3">{m.marketName}</div>
                  <div className="space-y-1.5">
                    {backOdds.slice(0, 4).map((o: any) => (
                      <button key={o.id}
                        onClick={() => addToSlip(o, m.matchId, m.matchName, m.id, m.marketName)}
                        className="flex w-full items-center justify-between rounded-lg bg-[#172033]/60 px-3 py-2 hover:bg-[#172033] transition-colors border border-transparent hover:border-slate-600"
                      >
                        <span className="text-sm text-slate-300 truncate">{o.label}</span>
                        <span className="text-sm font-bold text-[#00D4FF]">{Number(o.value).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* UPCOMING MATCHES */}
      <motion.section variants={fadeUp} className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Upcoming Matches</h2>
          <Link href="/matches" className="text-sm text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors">View All →</Link>
        </div>
        {upcomingMatches.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((match: any) => {
              const matchName = `${match.homeTeam?.name || "?"} vs ${match.awayTeam?.name || "?"}`;
              const firstMarketOdds = match.markets?.[0]?.odds?.filter((o: any) => o.type === "BACK")?.slice(0, 2) || [];
              return (
                <motion.div key={match.id} variants={fadeUp}>
                  <Link href={`/match/${match.id}`} className="card-hover block">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{match.league?.name}</span>
                      <span className="text-slate-500">{formatDate(match.startTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-300">{match.homeTeam?.shortName || match.homeTeam?.name}</span>
                      <span className="text-xs text-slate-600">vs</span>
                      <span className="font-medium text-slate-300">{match.awayTeam?.shortName || match.awayTeam?.name}</span>
                    </div>
                    {match.countdown > 0 && (
                      <div className="mt-2 text-center text-xs text-amber-400">
                        Starts in {Math.floor(match.countdown / 3600000)}h {Math.floor((match.countdown % 3600000) / 60000)}m
                      </div>
                    )}
                    {firstMarketOdds.length > 0 && (
                      <div className="mt-3 flex gap-2 border-t border-slate-700/30 pt-3">
                        {firstMarketOdds.map((o: any) => (
                          <button key={o.id}
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); addToSlip(o, match.id, matchName, match.markets[0].id, match.markets[0].name); }}
                            className="odds-btn flex-1"
                          >
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">{o.label}</span>
                            <span className="text-sm font-bold text-[#00D4FF]">{Number(o.value).toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center text-slate-500 py-8">No upcoming matches</div>
        )}
      </motion.section>

      {/* TOP WINNERS */}
      {topWinners.length > 0 && (
        <motion.section variants={fadeUp} className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">🏆 Top Winners</h2>
            <Link href="/leaderboard" className="text-sm text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors">Full Leaderboard →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {topWinners.map((entry: any, i: number) => (
              <motion.div key={entry.userId || i} variants={fadeUp} className="card-hover flex items-center gap-3">
                <span className="text-2xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <div className="flex-1">
                  <div className="font-medium text-white">{entry.username}</div>
                  <div className="text-xs text-slate-500">{entry.totalBets || 0} bets · {entry.totalWins || 0} wins</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-400">${formatCurrency(entry.totalWinnings || 0)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* SPORTS */}
      <motion.section variants={fadeUp} className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Popular Sports</h2>
          <Link href="/sports" className="text-sm text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors">View All →</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.isArray(sports) && sports.map((sport: any) => (
            <Link key={sport.id} href={`/sports/${sport.slug}`}
              className="group flex items-center gap-2 rounded-xl bg-[#111827]/80 border border-slate-700/30 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-[#172033] hover:border-[#00D4FF]/30 hover:text-white transition-all"
            >
              <span className="text-lg">{sport.icon || "🏅"}</span>
              <span>{sport.name}</span>
              <span className="text-xs text-slate-500">({sport._count?.leagues || 0})</span>
            </Link>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

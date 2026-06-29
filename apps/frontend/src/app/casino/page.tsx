"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  useCasinoCategories, useCasinoGames, useFeaturedCasinoGames,
  useCasinoPromotions, useCasinoTrending, useCasinoNewReleases,
  useCasinoRecentlyPlayed, useCasinoLeaderboard, useCasinoStats,
} from "@/hooks/useCasino";
import { GameCard } from "@/components/casino/GameCard";
import { WinnerFeed } from "@/components/casino/WinnerFeed";

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function SectionHeader({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-lg">{icon}</span>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {count !== undefined && (
        <span className="text-xs text-slate-500">({count})</span>
      )}
    </div>
  );
}

function GameGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl bg-[#111827]">
          <div className="aspect-[3/4] rounded-t-xl bg-[#172033]" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-3/4 rounded bg-[#172033]" />
            <div className="h-3 w-1/2 rounded bg-[#172033]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GameGrid({ games }: { games: any[] }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {games.map((game: any) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}

export default function CasinoPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");
  const [activeCategory, setActiveCategory] = useState<string | undefined>(categoryParam || undefined);
  const [searchTerm, setSearchTerm] = useState(searchParam || "");

  useEffect(() => {
    if (categoryParam) setActiveCategory(categoryParam);
    if (searchParam) setSearchTerm(searchParam);
  }, [categoryParam, searchParam]);

  const { data: categories } = useCasinoCategories();
  const { data: featuredData } = useFeaturedCasinoGames(8);
  const { data: promotions } = useCasinoPromotions();
  const { data: trendingData } = useCasinoTrending(6);
  const { data: newReleasesData } = useCasinoNewReleases(6);
  const { data: recentlyPlayedData } = useCasinoRecentlyPlayed(6);
  const { data: leaderboardData } = useCasinoLeaderboard(10);
  const { data: statsData } = useCasinoStats();
  const { data: gamesData, isLoading } = useCasinoGames({
    category: activeCategory,
    search: searchTerm || undefined,
  });

  const categoriesList = useMemo(() => categories?.data || categories || [], [categories]);
  const featuredGames = useMemo(() => featuredData?.data || featuredData || [], [featuredData]);
  const trendingGames = useMemo(() => trendingData?.data || trendingData || [], [trendingData]);
  const newReleases = useMemo(() => newReleasesData?.data || newReleasesData || [], [newReleasesData]);
  const recentlyPlayed = useMemo(() => recentlyPlayedData?.data || recentlyPlayedData || [], [recentlyPlayedData]);
  const leaderboard = useMemo(() => leaderboardData?.data || leaderboardData || [], [leaderboardData]);
  const stats = useMemo(() => statsData?.data || statsData || {} as any, [statsData]);
  const games = useMemo(() => gamesData?.data || gamesData || [], [gamesData]);
  const promos = useMemo(() => promotions?.data || promotions || [], [promotions]);

  const activeCatName = useMemo(
    () => activeCategory ? categoriesList.find((c: any) => c.slug === activeCategory)?.name : null,
    [activeCategory, categoriesList],
  );

  const showHome = !activeCategory && !searchTerm;

  return (
    <motion.div className="mx-auto max-w-7xl" initial="initial" animate="animate" variants={stagger}>
      {/* Hero Banner */}
      <motion.section variants={fadeUp} className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0B1220] border border-[#00D4FF]/10 p-8 md:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00D4FF]/10 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold md:text-5xl text-white">Casino</h1>
          <p className="mt-2 text-lg text-slate-400 max-w-xl">Premium gaming experience with hundreds of top-tier games</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { href: "/casino?category=slots", label: "Slots", icon: "🎰" },
              { href: "/casino?category=live-casino", label: "Live Casino", icon: "📺" },
              { href: "/casino?category=blackjack", label: "Blackjack", icon: "🃏" },
              { href: "/casino?category=roulette", label: "Roulette", icon: "🎡" },
              { href: "/casino?category=table-games", label: "Table Games", icon: "🎲" },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="rounded-lg bg-[#172033] px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-[#172033]/80 hover:text-[#00D4FF] transition-all border border-slate-600/30 hover:border-[#00D4FF]/30"
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
          {stats && (stats.totalGames || stats.totalWinners) && (
            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              {stats.totalGames !== undefined && (
                <div>
                  <span className="text-slate-500">Games </span>
                  <span className="font-bold text-white">{stats.totalGames}</span>
                </div>
              )}
              {stats.totalWinners !== undefined && (
                <div>
                  <span className="text-slate-500">Winners </span>
                  <span className="font-bold text-green-400">{stats.totalWinners}</span>
                </div>
              )}
              {stats.totalBets !== undefined && (
                <div>
                  <span className="text-slate-500">Bets </span>
                  <span className="font-bold text-[#00D4FF]">{stats.totalBets}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* Promotions */}
      {showHome && promos.length > 0 && (
        <motion.section variants={fadeUp} className="mb-8">
          <SectionHeader icon="🔥" title="Hot Promotions" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((p: any) => (
              <div key={p.id} className="group relative overflow-hidden rounded-xl border border-slate-700/30 bg-[#111827]/80 p-6 transition-all hover:border-[#00D4FF]/30 hover:shadow-lg hover:shadow-[#00D4FF]/10">
                {p.badge && (
                  <span className="absolute right-3 top-3 rounded-full bg-[#00D4FF] px-2.5 py-0.5 text-[10px] font-bold text-black">
                    {p.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{p.description}</p>
                {p.link && (
                  <Link href={p.link} className="mt-3 inline-block text-sm font-medium text-[#00D4FF] hover:text-[#00D4FF]/80">
                    Claim Now →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Categories */}
      <motion.section variants={fadeUp} className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-white">Categories</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveCategory(undefined); setSearchTerm(""); }}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              !activeCategory && !searchTerm
                ? "bg-[#00D4FF] text-black"
                : "bg-[#172033] text-slate-400 hover:text-white hover:bg-[#172033]/80"
            }`}
          >
            All Games
          </button>
          {categoriesList.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.slug ? undefined : cat.slug)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeCategory === cat.slug
                  ? "bg-[#00D4FF] text-black"
                  : "bg-[#172033] text-slate-400 hover:text-white hover:bg-[#172033]/80"
              }`}
            >
              {cat.icon} {cat.name}
              <span className="ml-1.5 text-xs opacity-60">({cat._count?.games || 0})</span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Main Content */}
      {showHome ? (
        <>
          {/* Featured Games */}
          {featuredGames.length > 0 && (
            <motion.section variants={fadeUp} className="mb-8">
              <SectionHeader icon="⭐" title="Featured Games" />
              <GameGrid games={featuredGames} />
            </motion.section>
          )}

          {/* Trending Games */}
          {trendingGames.length > 0 && (
            <motion.section variants={fadeUp} className="mb-8">
              <SectionHeader icon="🔥" title="Trending Now" count={trendingGames.length} />
              <GameGrid games={trendingGames} />
            </motion.section>
          )}

          {/* New Releases */}
          {newReleases.length > 0 && (
            <motion.section variants={fadeUp} className="mb-8">
              <SectionHeader icon="🆕" title="New Releases" count={newReleases.length} />
              <GameGrid games={newReleases} />
            </motion.section>
          )}

          {/* Two column: Recently Played + Winners */}
          <div className="grid gap-8 lg:grid-cols-3 mb-8">
            {/* Recently Played */}
            <motion.section variants={fadeUp} className="lg:col-span-2">
              <SectionHeader icon="🔄" title="Recently Played" />
              {recentlyPlayed.length > 0 ? (
                <GameGrid games={recentlyPlayed} />
              ) : (
                <div className="glass-card rounded-xl p-8 text-center">
                  <div className="text-4xl mb-3">🎮</div>
                  <p className="text-slate-500 text-sm">Play some games to see them here</p>
                </div>
              )}
            </motion.section>

            {/* Winners Feed */}
            <motion.section variants={fadeUp}>
              <div className="glass-card rounded-xl p-4 h-full">
                <WinnerFeed limit={8} />
              </div>
            </motion.section>
          </div>

          {/* Leaderboard + VIP */}
          <div className="grid gap-8 lg:grid-cols-3 mb-8">
            {/* Leaderboard */}
            <motion.section variants={fadeUp} className="lg:col-span-2">
              <SectionHeader icon="🏆" title="Leaderboard" />
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="divide-y divide-slate-700/30">
                  {leaderboard.slice(0, 10).map((entry: any, i: number) => {
                    const rankIcons = ["🥇", "🥈", "🥉"];
                    return (
                      <div key={entry.id || i} className="flex items-center gap-3 px-4 py-3 hover:bg-[#172033]/50 transition-colors">
                        <div className="w-8 text-center text-lg">{rankIcons[i] || `#${i + 1}`}</div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D4FF]/30 to-cyan-500/30 flex items-center justify-center text-sm font-bold text-white">
                          {(entry.user?.username || entry.username || "?")[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{entry.user?.username || entry.username || "Player"}</div>
                          <div className="text-[11px] text-slate-500">{entry._count?.sessions || entry.sessions || 0} games</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-yellow-400">${formatCurrency(entry.totalWon || entry.winnings || 0)}</div>
                        </div>
                      </div>
                    );
                  })}
                  {leaderboard.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">No leaderboard data yet</div>
                  )}
                </div>
              </div>
            </motion.section>

            {/* VIP Section */}
            <motion.section variants={fadeUp}>
              <div className="glass-card rounded-xl p-6 text-center h-full flex flex-col items-center justify-center">
                <div className="text-5xl mb-4">👑</div>
                <h3 className="text-xl font-bold text-white mb-2">VIP Club</h3>
                <p className="text-sm text-slate-400 mb-4">Exclusive rewards, higher limits, personal manager</p>
                <div className="flex flex-wrap gap-3 justify-center text-xs">
                  <div className="bg-[#172033] rounded-lg px-3 py-2">
                    <div className="text-yellow-400 font-bold">5%</div>
                    <div className="text-slate-500">Cashback</div>
                  </div>
                  <div className="bg-[#172033] rounded-lg px-3 py-2">
                    <div className="text-yellow-400 font-bold">x2</div>
                    <div className="text-slate-500">Rewards</div>
                  </div>
                  <div className="bg-[#172033] rounded-lg px-3 py-2">
                    <div className="text-yellow-400 font-bold">24/7</div>
                    <div className="text-slate-500">Support</div>
                  </div>
                </div>
                <Link href="/vip" className="mt-4 text-sm text-[#00D4FF] hover:text-[#00D4FF]/80">
                  Learn More →
                </Link>
              </div>
            </motion.section>
          </div>
        </>
      ) : (
        /* Filtered Games */
        <motion.section variants={fadeUp} className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {activeCatName || (searchTerm ? `Search: "${searchTerm}"` : "All Games")}
              <span className="ml-2 text-sm font-normal text-slate-500">({games.length})</span>
            </h2>
            {activeCategory && (
              <button onClick={() => setActiveCategory(undefined)} className="text-sm text-slate-500 hover:text-white transition-colors">
                Clear filter
              </button>
            )}
          </div>
          {isLoading ? (
            <GameGridSkeleton count={12} />
          ) : games.length > 0 ? (
            <GameGrid games={games} />
          ) : (
            <div className="glass-card text-center py-12">
              <div className="text-4xl mb-3">🎰</div>
              <p className="text-slate-500">No games found</p>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="mt-3 text-sm text-[#00D4FF] hover:text-[#00D4FF]/80">
                  Clear search
                </button>
              )}
            </div>
          )}
        </motion.section>
      )}
    </motion.div>
  );
}

// Helper for formatCurrency since we can't import it in this scope
function formatCurrency(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toFixed(2);
}

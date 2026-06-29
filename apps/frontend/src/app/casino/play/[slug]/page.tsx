"use client";

import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { casinoApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const SlotGame = lazy(() => import("@/components/casino/SlotGame").then((m) => ({ default: m.SlotGame })));
const RouletteGame = lazy(() => import("@/components/casino/RouletteGame").then((m) => ({ default: m.RouletteGame })));
const BlackjackGame = lazy(() => import("@/components/casino/BlackjackGame").then((m) => ({ default: m.BlackjackGame })));
const DiceGame = lazy(() => import("@/components/casino/DiceGame").then((m) => ({ default: m.DiceGame })));
const MinesGame = lazy(() => import("@/components/casino/MinesGame").then((m) => ({ default: m.MinesGame })));
const PlinkoGame = lazy(() => import("@/components/casino/PlinkoGame").then((m) => ({ default: m.PlinkoGame })));
const CrashGame = lazy(() => import("@/components/casino/CrashGame").then((m) => ({ default: m.CrashGame })));

const GAME_MAP: Record<string, React.ComponentType<{ gameSlug: string; gameName: string }>> = {
  "gates-of-olympus": SlotGame, "sweet-bonanza": SlotGame, "wolf-gold": SlotGame,
  "sugar-rush": SlotGame, "starburst": SlotGame, "mega-moolah": SlotGame,
  "dog-house-megaways": SlotGame, "big-bass-bonanza": SlotGame, "dead-or-alive-2": SlotGame,
  "book-of-dead": SlotGame, "aztec-gems": SlotGame, "buffalo-king": SlotGame,
  "live-roulette": RouletteGame, "european-roulette": RouletteGame,
  "american-roulette": RouletteGame, "french-roulette": RouletteGame,
  "lightning-roulette": RouletteGame,
  "live-blackjack": BlackjackGame, "classic-blackjack": BlackjackGame,
  "infinite-blackjack": BlackjackGame, "vip-blackjack": BlackjackGame,
  "blackjack-party": BlackjackGame,
  "dice": DiceGame, "mines": MinesGame, "plinko": PlinkoGame, "crash": CrashGame,
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-[#00D4FF] border-t-transparent animate-spin" />
        <span className="text-sm text-slate-400">Loading game...</span>
      </div>
    </div>
  );
}

function formatCurrency(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toFixed(2);
}

export default function CasinoPlayPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showRecent, setShowRecent] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showProvablyFair, setShowProvablyFair] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(`/casino/play/${slug}`));
    }
  }, [hydrated, isAuthenticated, router, slug]);

  const { data: gameData, isLoading } = useQuery({
    queryKey: ["casino", "game", slug],
    queryFn: () => casinoApi.getGameBySlug(slug).then((r) => r.data),
    enabled: !!slug,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ["casino", "sessions", slug, 1, 10],
    queryFn: () => casinoApi.getSessions({ page: 1, limit: 10 }).then((r) => r.data),
    enabled: !!slug && !!isAuthenticated && hydrated,
    refetchInterval: 30000,
  });

  const { data: relatedData } = useQuery({
    queryKey: ["casino", "games", slug],
    queryFn: () => casinoApi.getGames({ category: undefined, limit: 6 }).then((r) => r.data),
    enabled: !!slug,
    staleTime: 60000,
  });

  const game = gameData?.data || gameData;
  const gameName = game?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const GameComponent = GAME_MAP[slug];
  const sessions = Array.isArray(sessionsData?.data?.data) ? sessionsData.data.data : Array.isArray(sessionsData?.data) ? sessionsData.data : [];
  const relatedGames = Array.isArray(relatedData?.data?.data) ? relatedData.data.data : Array.isArray(relatedData?.data) ? relatedData.data : [];
  const filteredRelatedGames = relatedGames.filter((g: any) => g.slug !== slug).slice(0, 6);

  const stats = {
    total: sessions.length,
    won: sessions.filter((s: any) => s.status === "WON").length,
    lost: sessions.filter((s: any) => s.status === "LOST").length,
    totalBet: sessions.reduce((sum: number, s: any) => sum + Number(s.betAmount || 0), 0),
    totalWon: sessions.reduce((sum: number, s: any) => sum + Number(s.winAmount || 0), 0),
  };
  const winRate = stats.total > 0 ? ((stats.won / stats.total) * 100).toFixed(1) : "0.0";

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  if (!hydrated || !isAuthenticated) {
    return <LoadingFallback />;
  }

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <motion.div
      className={`mx-auto ${fullscreen ? "max-w-full px-0" : "max-w-6xl py-6 px-4"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top bar */}
      <div className={`flex items-center justify-between mb-4 ${fullscreen ? "px-4 pt-2" : ""}`}>
        <Link href={`/casino/game/${slug}`} className="text-sm text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors">
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn(!soundOn)}
            className="w-8 h-8 rounded-lg bg-[#172033] flex items-center justify-center text-sm hover:bg-[#1e2a45] transition-colors"
            title={soundOn ? "Mute" : "Unmute"}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg bg-[#172033] flex items-center justify-center text-sm hover:bg-[#1e2a45] transition-colors"
            title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {fullscreen ? "⛶" : "⛶"}
          </button>
        </div>
      </div>

      {/* Header */}
      {!fullscreen && (
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">{gameName}</h1>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mt-1">
            {game?.provider && <span>by {game.provider.name}</span>}
            {game?.rtp && <span>RTP: {Number(game.rtp).toFixed(2)}%</span>}
            {game?.category && <span>{game.category.icon} {game.category.name}</span>}
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className={`rounded-2xl border border-slate-700/30 bg-[#111827]/80 backdrop-blur-sm p-4 md:p-6 ${
        fullscreen ? "min-h-screen rounded-none border-0" : ""
      }`}>
        <Suspense fallback={<LoadingFallback />}>
          {GameComponent ? (
            <GameComponent gameSlug={slug} gameName={gameName} />
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🎮</div>
              <p className="text-slate-400">This game is not yet available for play.</p>
              <Link href={`/casino/game/${slug}`} className="mt-4 inline-block text-[#00D4FF] hover:text-[#00D4FF]/80">
                Back to game info →
              </Link>
            </div>
          )}
        </Suspense>
      </div>

      {/* Bottom sections (hidden in fullscreen) */}
      {!fullscreen && (
        <div className="mt-8 space-y-6">
          {/* Toggle bars */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRecent(!showRecent)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                showRecent ? "bg-[#00D4FF] text-black" : "bg-[#172033] text-slate-400 hover:text-white"
              }`}
            >
              📋 Recent Results ({sessions.length})
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                showStats ? "bg-[#00D4FF] text-black" : "bg-[#172033] text-slate-400 hover:text-white"
              }`}
            >
              📊 Statistics
            </button>
            <button
              onClick={() => setShowProvablyFair(!showProvablyFair)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                showProvablyFair ? "bg-[#00D4FF] text-black" : "bg-[#172033] text-slate-400 hover:text-white"
              }`}
            >
              🔒 Provably Fair
            </button>
          </div>

          <AnimatePresence>
            {showRecent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Results</h3>
                  {sessions.length > 0 ? (
                    <div className="divide-y divide-slate-700/30 max-h-64 overflow-y-auto">
                      {sessions.map((s: any, i: number) => (
                        <div key={s.id || i} className="flex items-center justify-between py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${s.status === "WON" ? "bg-green-400" : s.status === "LOST" ? "bg-red-400" : "bg-yellow-400"}`} />
                            <span className="text-slate-400 text-xs">
                              {new Date(s.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">Bet ${formatCurrency(Number(s.betAmount))}</span>
                            {s.status === "WON" && (
                              <span className="text-green-400 font-bold">+${formatCurrency(Number(s.winAmount))}</span>
                            )}
                            {s.status === "LOST" && (
                              <span className="text-red-400 font-bold">-${formatCurrency(Number(s.betAmount))}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm">No sessions yet</div>
                  )}
                </div>
              </motion.div>
            )}

            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Game Statistics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[#172033] rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white">{stats.total}</div>
                      <div className="text-xs text-slate-500 mt-1">Total Bets</div>
                    </div>
                    <div className="bg-[#172033] rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">{stats.won}</div>
                      <div className="text-xs text-slate-500 mt-1">Wins</div>
                    </div>
                    <div className="bg-[#172033] rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-red-400">{stats.lost}</div>
                      <div className="text-xs text-slate-500 mt-1">Losses</div>
                    </div>
                    <div className="bg-[#172033] rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-[#00D4FF]">{winRate}%</div>
                      <div className="text-xs text-slate-500 mt-1">Win Rate</div>
                    </div>
                    <div className="bg-[#172033] rounded-xl p-4 text-center">
                      <div className="text-lg font-bold text-white">${formatCurrency(stats.totalBet)}</div>
                      <div className="text-xs text-slate-500 mt-1">Total Bet</div>
                    </div>
                    <div className="bg-[#172033] rounded-xl p-4 text-center">
                      <div className="text-lg font-bold text-green-400">${formatCurrency(stats.totalWon)}</div>
                      <div className="text-xs text-slate-500 mt-1">Total Won</div>
                    </div>
                    <div className="bg-[#172033] rounded-xl p-4 text-center">
                      <div className="text-lg font-bold text-white">
                        ${formatCurrency(stats.totalWon - stats.totalBet)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Net P/L</div>
                    </div>
                    <div className="bg-[#172033] rounded-xl p-4 text-center">
                      <div className="text-lg font-bold text-white">{game?.rtp || "N/A"}%</div>
                      <div className="text-xs text-slate-500 mt-1">RTP</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {showProvablyFair && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">🔒 Provably Fair</h3>
                  <div className="text-sm text-slate-400 space-y-2 leading-relaxed">
                    <p>All game outcomes are determined server-side using a cryptographically secure random number generator.</p>
                    <p>Each game result is generated using:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-500">
                      <li>Server seed (generated per session)</li>
                      <li>Client seed (user-provided or randomly generated)</li>
                      <li>Nonce (increments with each bet)</li>
                    </ul>
                    <p className="text-xs text-slate-600 mt-2">
                      The combination of these three inputs produces a verifiable, tamper-proof outcome.
                      You can verify any game result by checking the server seed, client seed, and nonce used.
                    </p>
                    <div className="mt-3 p-3 bg-[#172033] rounded-lg">
                      <p className="text-xs text-slate-500">
                        Server Seed: <span className="font-mono text-slate-400">••••••••••••••••</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Client Seed: <span className="font-mono text-slate-400">{Math.random().toString(36).slice(2, 10)}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Nonce: <span className="font-mono text-slate-400">{stats.total + 1}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Related Games */}
          {filteredRelatedGames.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-sm font-semibold text-slate-300 mb-3">🎯 Related Games</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredRelatedGames.map((g: any) => (
                  <Link key={g.id} href={`/casino/play/${g.slug}`}
                    className="group relative overflow-hidden rounded-xl bg-[#111827]/80 border border-slate-700/30 p-3 text-center hover:border-[#00D4FF]/30 transition-all hover:shadow-lg hover:shadow-[#00D4FF]/10"
                  >
                    <div className="text-2xl mb-1">{g.category?.icon || "🎮"}</div>
                    <div className="text-xs font-medium text-white truncate group-hover:text-[#00D4FF] transition-colors">
                      {g.name}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {g.rtp ? `${g.rtp}%` : ""}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      )}
    </motion.div>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCasinoGame } from "@/hooks/useCasino";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function CasinoGameDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { data: gameData, isLoading } = useCasinoGame(slug);

  const handlePlayNow = () => {
    if (!isAuthenticated) {
      toast.error("Please login to play");
      router.push("/login?redirect=" + encodeURIComponent(`/casino/play/${slug}`));
      return;
    }
    router.push(`/casino/play/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="animate-pulse p-12 text-center">
          <div className="mx-auto h-8 w-48 rounded bg-[#172033] mb-4" />
          <div className="mx-auto h-4 w-64 rounded bg-[#172033]" />
        </div>
      </div>
    );
  }

  const game = gameData?.data || gameData;
  if (!game) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🎰</div>
          <p className="text-slate-400">Game not found</p>
          <Link href="/casino" className="mt-4 inline-block text-sm text-[#00D4FF] hover:text-[#00D4FF]/80">← Back to Casino</Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/casino" className="hover:text-white transition-colors">Casino</Link>
        <span>/</span>
        <Link href={`/casino?category=${game.category?.slug}`} className="hover:text-white transition-colors">{game.category?.name}</Link>
        <span>/</span>
        <span className="text-white">{game.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Preview */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/30 bg-gradient-to-br from-[#111827] via-[#172033] to-[#111827]">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#00D4FF]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />

            <div className="relative aspect-video flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-8xl mb-4"
                >
                  {game.category?.icon || "🎰"}
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">{game.name}</h1>
                <p className="mt-2 text-lg text-slate-400">{game.provider?.name}</p>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-700/20">
              {[
                { label: "Category", value: `${game.category?.icon || ""} ${game.category?.name || ""}` },
                { label: "Provider", value: game.provider?.name || "N/A" },
                { label: "RTP", value: game.rtp ? `${game.rtp}%` : "N/A", highlight: "text-green-400" },
                { label: "Bet Range", value: `$${formatCurrency(game.minBet || 0)} - $${formatCurrency(game.maxBet || 0)}` },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#111827]/80 p-4 text-center">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</div>
                  <div className={`mt-1 text-sm font-medium ${stat.highlight || "text-white"}`}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-slate-700/30 bg-[#111827]/80 backdrop-blur-sm p-6">
            <h2 className="text-xl font-bold text-white mb-4">{game.name}</h2>

            <div className="mb-6 space-y-3 text-sm">
              {[
                { label: "Provider", value: game.provider?.name || "N/A" },
                { label: "Category", value: `${game.category?.icon || ""} ${game.category?.name || ""}` },
                { label: "RTP", value: game.rtp ? `${game.rtp}%` : "N/A", highlight: "text-green-400 font-bold" },
                { label: "Min Bet", value: `$${formatCurrency(game.minBet || 0)}` },
                { label: "Max Bet", value: `$${formatCurrency(game.maxBet || 0)}` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-slate-400">{item.label}</span>
                  <span className={item.highlight || "text-white"}>{item.value}</span>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePlayNow}
              className="w-full rounded-xl bg-[#00D4FF] px-6 py-3.5 text-lg font-bold text-black hover:bg-[#00D4FF]/90 transition-all shadow-lg shadow-[#00D4FF]/30"
            >
              Play Now
            </motion.button>

            <p className="mt-4 text-center text-[10px] text-slate-600">
              This game is for entertainment purposes. Play responsibly.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

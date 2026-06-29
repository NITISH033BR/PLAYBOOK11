"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { useCasinoPlay } from "@/hooks/useCasinoPlay";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const SYMBOLS = ["star", "diamond", "seven", "bell", "watermelon", "cherry", "lemon", "plum", "orange", "grape", "wild", "scatter"];

const SYMBOL_MAP: Record<string, { icon: string; color: string }> = {
  star: { icon: "⭐", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  diamond: { icon: "💎", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  seven: { icon: "7️⃣", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  bell: { icon: "🔔", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  watermelon: { icon: "🍉", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  cherry: { icon: "🍒", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  lemon: { icon: "🍋", color: "bg-lime-500/20 text-lime-300 border-lime-500/30" },
  plum: { icon: "🫐", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  orange: { icon: "🍊", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  grape: { icon: "🍇", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  wild: { icon: "🃏", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  scatter: { icon: "🌟", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
};

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];

function SlotSymbol({ id, spinning, delay }: { id: number; spinning: boolean; delay: number }) {
  const name = SYMBOLS[id] || "unknown";
  const info = SYMBOL_MAP[name] || { icon: "❓", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" };

  return (
    <motion.div
      animate={spinning ? { y: [0, -8, 8, 0], rotate: [0, 3, -3, 0] } : {}}
      transition={{ duration: 0.3, delay, repeat: spinning ? Infinity : 0, repeatDelay: 0.1 }}
      className={`w-full aspect-square rounded-xl border flex items-center justify-center text-2xl sm:text-3xl md:text-4xl ${info.color} shadow-lg`}
    >
      {info.icon}
    </motion.div>
  );
}

export function SlotGame({ gameSlug, gameName }: { gameSlug: string; gameName: string }) {
  const { play } = useCasinoPlay();
  const { data: walletData } = useWallet();
  const wallet: any = walletData?.data || walletData;

  const [grid, setGrid] = useState<number[][] | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [spinningGrid, setSpinningGrid] = useState<number[][] | null>(null);
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    if (wallet?.balance !== undefined) setBalance(Number(wallet.balance));
  }, [wallet?.balance]);

  const spin = useCallback(async () => {
    if (spinning || betAmount <= 0) return;
    if (betAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setSpinning(true);
    setShowWin(false);
    setLastResult(null);

    const animGrid = Array.from({ length: 5 }, () =>
      Array.from({ length: 3 }, () => Math.floor(Math.random() * 11))
    );
    setSpinningGrid(animGrid);

    setTimeout(async () => {
      try {
        const res: any = await play.mutateAsync({ gameSlug, betAmount });
        if (res?.result?.grid) {
          setGrid(res.result.grid);
          setSpinningGrid(null);
          setLastResult(res.result);
          if (res.balance !== undefined) setBalance(res.balance);
          if (res.result.totalWin > 0) setShowWin(true);
        }
      } catch {
        setSpinningGrid(null);
      } finally {
        setSpinning(false);
      }
    }, 800);
  }, [spinning, betAmount, balance, gameSlug, play]);

  const displayGrid = spinning ? spinningGrid : grid;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Info Bar */}
      <div className="flex items-center justify-center gap-6 flex-wrap">
        <div className="glass-card rounded-lg px-4 py-2 text-sm">
          <span className="text-slate-400">Balance </span>
          <span className="font-bold text-white">${formatCurrency(balance)}</span>
        </div>
        <div className="glass-card rounded-lg px-4 py-2 text-sm">
          <span className="text-slate-400">Bet </span>
          <span className="font-bold text-[#00D4FF]">${formatCurrency(betAmount)}</span>
        </div>
        <AnimatePresence>
          {showWin && lastResult && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="glass-card rounded-lg px-4 py-2 text-sm"
            >
              <span className="text-green-400 font-bold text-lg">+${formatCurrency(lastResult.totalWin)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reels Container */}
      <div className="relative w-full max-w-md">
        {/* Ambient glow */}
        <div className="absolute -inset-4 bg-[#00D4FF]/5 rounded-3xl blur-xl" />

        <div className="relative bg-gradient-to-b from-[#172033] via-[#111827] to-[#172033] rounded-2xl border border-slate-700/30 p-4 shadow-2xl">
          {/* Reel grid */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {Array.from({ length: 5 }, (_, col) => (
              <div key={col} className="flex flex-col gap-1.5 sm:gap-2">
                {Array.from({ length: 3 }, (_, row) => {
                  const symId = displayGrid?.[col]?.[row] ?? -1;
                  return (
                    <SlotSymbol
                      key={row}
                      id={symId}
                      spinning={spinning}
                      delay={col * 0.05 + row * 0.03}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Paylines result */}
      <AnimatePresence>
        {lastResult && !spinning && lastResult.paylineResults?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {lastResult.paylineResults.map((p: any, i: number) => (
              <span key={i} className="glass-card rounded-lg px-3 py-1.5 text-xs text-slate-300">
                {SYMBOL_MAP[SYMBOLS[p.symbolId]]?.icon || "?"} x{p.count} = <span className="text-green-400 font-bold">${formatCurrency(p.amount)}</span>
              </span>
            ))}
            {(lastResult.scatterCount || 0) >= 3 && (
              <span className="glass-card rounded-lg px-3 py-1.5 text-xs text-blue-300">
                🌟 Scatter x{lastResult.scatterCount}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bet Selector */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {BET_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => setBetAmount(amount)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              betAmount === amount
                ? "bg-[#00D4FF] text-black shadow-lg shadow-[#00D4FF]/30"
                : "bg-[#172033] text-slate-400 hover:text-white border border-slate-600/30"
            }`}
          >
            ${amount}
          </button>
        ))}
      </div>

      {/* Spin Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={spin}
        disabled={spinning || play.isPending || balance < betAmount}
        className="px-16 py-3.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-cyan-400 text-black font-bold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#00D4FF]/30"
      >
        {spinning ? (
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
            Spinning...
          </span>
        ) : (
          "SPIN"
        )}
      </motion.button>

      <div className="text-xs text-slate-600">{gameName} · Min $1 · Max $100</div>
    </div>
  );
}

"use client";

import { useState, useCallback, useEffect } from "react";
import { useCasinoPlay } from "@/hooks/useCasinoPlay";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const BET_TYPES = [
  { id: "red", label: "Red", payout: "2:1", color: "bg-red-600 hover:bg-red-500" },
  { id: "black", label: "Black", payout: "2:1", color: "bg-slate-900 hover:bg-slate-800" },
  { id: "odd", label: "Odd", payout: "2:1", color: "bg-[#172033] hover:bg-slate-600" },
  { id: "even", label: "Even", payout: "2:1", color: "bg-[#172033] hover:bg-slate-600" },
  { id: "low", label: "1-18", payout: "2:1", color: "bg-[#172033] hover:bg-slate-600" },
  { id: "high", label: "19-36", payout: "2:1", color: "bg-[#172033] hover:bg-slate-600" },
  { id: "dozen1", label: "1st 12", payout: "3:1", color: "bg-[#172033] hover:bg-slate-600" },
  { id: "dozen2", label: "2nd 12", payout: "3:1", color: "bg-[#172033] hover:bg-slate-600" },
  { id: "dozen3", label: "3rd 12", payout: "3:1", color: "bg-[#172033] hover:bg-slate-600" },
];

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];

export function RouletteGame({ gameSlug, gameName }: { gameSlug: string; gameName: string }) {
  const { play } = useCasinoPlay();
  const { data: walletData } = useWallet();
  const wallet: any = walletData?.data || walletData;

  const [betAmount, setBetAmount] = useState(10);
  const [betType, setBetType] = useState("red");
  const [balance, setBalance] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [resultColor, setResultColor] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (wallet?.balance !== undefined) setBalance(Number(wallet.balance));
  }, [wallet?.balance]);

  const playBet = useCallback(async () => {
    if (spinning || betAmount <= 0) return;
    if (betAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setSpinning(true);
    setShowResult(false);
    setResultNumber(null);
    setResultColor(null);
    setResult(null);

    setTimeout(async () => {
      try {
        const res: any = await play.mutateAsync({
          gameSlug,
          betAmount,
          betData: { type: betType },
        });
        if (res?.result) {
          setResult(res.result);
          setResultNumber(res.result.number);
          setResultColor(res.result.color);
          setShowResult(true);
          if (res.balance !== undefined) setBalance(res.balance);
        }
      } catch {
        // handled by hook
      } finally {
        setSpinning(false);
      }
    }, 1200);
  }, [spinning, betAmount, balance, betType, gameSlug, play]);

  const getColorClass = (num: number | null) => {
    if (num === null) return "from-green-800 to-green-700";
    if (num === 0) return "from-green-600 to-green-500";
    return REDS.includes(num) ? "from-red-700 to-red-600" : "from-slate-800 to-slate-700";
  };

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
          {showResult && result?.winAmount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="glass-card rounded-lg px-4 py-2 text-sm"
            >
              <span className="text-green-400 font-bold text-lg">+${formatCurrency(result.winAmount)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Roulette Wheel */}
      <div className="relative">
        <div className="absolute -inset-6 bg-[#00D4FF]/5 rounded-full blur-2xl" />
        <motion.div
          animate={spinning ? { rotate: 360 * 5 } : {}}
          transition={spinning ? { duration: 1.2, ease: "easeOut" } : {}}
          className={`relative w-56 h-56 rounded-full bg-gradient-to-br ${getColorClass(resultNumber)} border-4 border-slate-600 flex items-center justify-center shadow-2xl`}
        >
          <div className="text-center">
            <AnimatePresence mode="wait">
              {showResult && resultNumber !== null ? (
                <motion.div
                  key="result"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="text-5xl font-bold text-white">{resultNumber}</div>
                  <div className="text-sm font-medium text-white/80 uppercase mt-1">{resultColor}</div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-3xl"
                >
                  {spinning ? (
                    <span className="text-white/60">...</span>
                  ) : (
                    <span>🎡</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Bet Type Selector */}
      <div className="grid grid-cols-3 gap-2 max-w-md w-full">
        {BET_TYPES.map((bt) => (
          <button
            key={bt.id}
            onClick={() => setBetType(bt.id)}
            className={`px-3 py-3 rounded-xl text-sm font-medium transition-all ${
              betType === bt.id
                ? `${bt.color} text-white ring-2 ring-[#00D4FF] shadow-lg`
                : `${bt.color} text-white/70`
            }`}
          >
            <div>{bt.label}</div>
            <div className="text-[10px] opacity-60 mt-0.5">{bt.payout}</div>
          </button>
        ))}
      </div>

      {/* Bet Amount */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {BET_AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => setBetAmount(a)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              betAmount === a
                ? "bg-[#00D4FF] text-black shadow-lg shadow-[#00D4FF]/30"
                : "bg-[#172033] text-slate-400 hover:text-white border border-slate-600/30"
            }`}
          >
            ${a}
          </button>
        ))}
      </div>

      {/* Spin */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={playBet}
        disabled={spinning || play.isPending || balance < betAmount}
        className="px-16 py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/30"
      >
        {spinning ? (
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
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

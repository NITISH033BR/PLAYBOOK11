"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useCasinoPlay } from "@/hooks/useCasinoPlay";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];
const RISK_LEVELS = ["low", "medium", "high"] as const;
const ROWS = 12;

const MULTIPLIERS: Record<string, number[]> = {
  low: [5, 3, 1.5, 0.5, 0.3, 0.2, 0.3, 0.5, 1.5, 3, 5],
  medium: [10, 5, 2, 0.4, 0.2, 0.1, 0.2, 0.4, 2, 5, 10],
  high: [20, 8, 3, 0.2, 0.1, 0.05, 0.1, 0.2, 3, 8, 20],
};

const SLOT_COLORS = [
  "bg-red-500/30 text-red-300 border-red-500/40",
  "bg-orange-500/30 text-orange-300 border-orange-500/40",
  "bg-yellow-500/30 text-yellow-300 border-yellow-500/40",
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "bg-slate-600/20 text-slate-400 border-slate-600/30",
  "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-yellow-500/30 text-yellow-300 border-yellow-500/40",
  "bg-orange-500/30 text-orange-300 border-orange-500/40",
  "bg-red-500/30 text-red-300 border-red-500/40",
];

export function PlinkoGame({ gameSlug, gameName }: { gameSlug: string; gameName: string }) {
  const { play } = useCasinoPlay();
  const { data: walletData } = useWallet();
  const wallet: any = walletData?.data || walletData;

  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(0);
  const [risk, setRisk] = useState<"low" | "medium" | "high">("medium");
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [ballPath, setBallPath] = useState<number[]>([]);
  const [ballPos, setBallPos] = useState(0);
  const [currentRow, setCurrentRow] = useState(-1);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (wallet?.balance !== undefined) setBalance(Number(wallet.balance));
  }, [wallet?.balance]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const drop = useCallback(async () => {
    if (dropping || betAmount <= 0) return;
    if (betAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setDropping(true);
    setResult(null);
    setBallPath([]);
    setCurrentRow(0);

    try {
      const res: any = await play.mutateAsync({
        gameSlug,
        betAmount,
        betData: { rows: ROWS, risk },
      });
      const path = res?.result?.path || [];
      const slotIdx = res?.result?.slot || 0;

      setBallPath(path);
      setResult(res?.result || res);
      if (res?.balance !== undefined) setBalance(res.balance);

      let row = 0;
      const animate = () => {
        if (row < path.length) {
          setCurrentRow(row);
          setBallPos(path[row]);
          row++;
          animRef.current = requestAnimationFrame(() => {
            setTimeout(animate, 50);
          });
        } else {
          setCurrentRow(ROWS);
          setBallPos(slotIdx);
          setTimeout(() => setDropping(false), 300);
        }
      };
      animate();
    } catch {
      setDropping(false);
    }
  }, [dropping, betAmount, balance, gameSlug, play, risk]);

  const mults = MULTIPLIERS[risk] || MULTIPLIERS.medium;
  const slot = result?.slot ?? -1;
  const multiplier = result?.multiplier ?? 1;
  const showResult = result !== null && !dropping;

  return (
    <div className="flex flex-col items-center gap-6">
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
          {showResult && multiplier > 1 && (
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

      <div className="relative">
        <div className="grid grid-cols-11 gap-1">
          {mults.map((m, i) => {
            const isActive = showResult && i === slot;
            const multColor = SLOT_COLORS[i] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
            return (
              <motion.div
                key={i}
                animate={isActive ? { scale: [1, 1.15, 1], y: [0, -4, 0] } : {}}
                transition={isActive ? { duration: 0.5, repeat: Infinity } : {}}
                className={`px-1 py-2 text-center rounded-lg border text-[10px] font-bold leading-tight transition-all ${multColor} ${
                  isActive ? "ring-2 ring-[#00D4FF] shadow-lg shadow-[#00D4FF]/30" : ""
                }`}
              >
                <div>{m.toFixed(1)}x</div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 bg-gradient-to-b from-[#172033] to-[#111827] rounded-2xl border border-slate-700/30 p-4 min-h-[200px] relative">
          {ballPath.length > 0 && currentRow >= 0 && (
            <motion.div
              className={`absolute w-4 h-4 rounded-full bg-[#00D4FF] shadow-lg shadow-[#00D4FF]/50 z-10 transition-all duration-75`}
              style={{
                left: `${(ballPos / (mults.length - 1)) * 100}%`,
                top: `${(currentRow / ROWS) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}
          {!dropping && !showResult && (
            <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
              Drop a ball to start
            </div>
          )}
          {showResult && (
            <div className="flex flex-col items-center justify-center h-[200px]">
              <div className={`text-3xl font-bold ${multiplier > 1 ? "text-green-400" : "text-red-400"}`}>
                {multiplier > 1 ? `${multiplier.toFixed(2)}x` : `0.0x`}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {multiplier > 1
                  ? `Won $${formatCurrency(result.winAmount)}`
                  : `Lost $${formatCurrency(betAmount)}`}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-xs text-slate-400 mr-1">Risk:</span>
        {RISK_LEVELS.map((r) => (
          <button
            key={r}
            onClick={() => setRisk(r)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all capitalize ${
              risk === r
                ? "bg-[#00D4FF] text-black shadow-lg shadow-[#00D4FF]/30"
                : "bg-[#172033] text-slate-400 hover:text-white border border-slate-600/30"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

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

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={drop}
        disabled={dropping || play.isPending || balance < betAmount}
        className="px-16 py-3.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-cyan-400 text-black font-bold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#00D4FF]/30"
      >
        {dropping ? (
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
            Dropping...
          </span>
        ) : (
          "DROP BALL"
        )}
      </motion.button>

      <div className="text-xs text-slate-600">{gameName} · {ROWS} rows · {risk} risk</div>
    </div>
  );
}

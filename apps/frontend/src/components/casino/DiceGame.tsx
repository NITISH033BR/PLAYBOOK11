"use client";

import { useState, useCallback, useEffect } from "react";
import { useCasinoPlay } from "@/hooks/useCasinoPlay";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export function DiceGame({ gameSlug, gameName }: { gameSlug: string; gameName: string }) {
  const { play } = useCasinoPlay();
  const { data: walletData } = useWallet();
  const wallet: any = walletData?.data || walletData;

  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [diceValues, setDiceValues] = useState<[number, number]>([1, 1]);
  const [prediction, setPrediction] = useState<"over" | "under" | "exact">("over");
  const [target, setTarget] = useState(7);

  useEffect(() => {
    if (wallet?.balance !== undefined) setBalance(Number(wallet.balance));
  }, [wallet?.balance]);

  const roll = useCallback(async () => {
    if (rolling || betAmount <= 0) return;
    if (betAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setRolling(true);
    setResult(null);

    const interval = setInterval(() => {
      setDiceValues([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
    }, 80);

    setTimeout(async () => {
      clearInterval(interval);
      try {
        const res: any = await play.mutateAsync({
          gameSlug,
          betAmount,
          betData: { prediction, target },
        });
        setResult(res?.result || res);
        if (res?.result) {
          setDiceValues([res.result.dice1, res.result.dice2]);
        }
        if (res?.balance !== undefined) setBalance(res.balance);
      } catch {
        setDiceValues([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      } finally {
        setRolling(false);
      }
    }, 1200);
  }, [rolling, betAmount, balance, gameSlug, play, prediction, target]);

  const showResult = result?.total !== undefined;
  const isWin = result?.isWin || result?.winAmount > 0;
  const total = result?.total || 0;

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
          {showResult && isWin && (
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

      <div className="flex items-center gap-8 py-4">
        {[0, 1].map((idx) => (
          <motion.div
            key={idx}
            animate={rolling ? { rotate: [0, 360, 720], scale: [1, 1.1, 1] } : { scale: [1, 1.15, 1] }}
            transition={rolling ? { duration: 0.6, repeat: Infinity } : { duration: 0.3 }}
            className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-[#172033] to-[#111827] border-2 flex items-center justify-center text-5xl shadow-xl ${
              showResult && isWin
                ? "border-green-500/50 shadow-green-500/20"
                : showResult
                ? "border-red-500/50 shadow-red-500/20"
                : "border-slate-600/30"
            }`}
          >
            {DICE_FACES[diceValues[idx] - 1] || "🎲"}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className={`text-2xl font-bold ${isWin ? "text-green-400" : "text-red-400"}`}>
              Total: {total} {isWin ? "✓ Win" : "✗ Loss"}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              Predicted {prediction} {target} · Result: {total}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-xs text-slate-400 mr-1">Prediction:</span>
        {(["over", "under", "exact"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPrediction(p)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all capitalize ${
              prediction === p
                ? "bg-[#00D4FF] text-black shadow-lg shadow-[#00D4FF]/30"
                : "bg-[#172033] text-slate-400 hover:text-white border border-slate-600/30"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-xs text-slate-400 mr-1">Target:</span>
        {[4, 5, 6, 7, 8, 9, 10].map((t) => (
          <button
            key={t}
            onClick={() => setTarget(t)}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
              target === t
                ? "bg-[#00D4FF] text-black shadow-lg shadow-[#00D4FF]/30"
                : "bg-[#172033] text-slate-400 hover:text-white border border-slate-600/30"
            }`}
          >
            {t}
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
        onClick={roll}
        disabled={rolling || play.isPending || balance < betAmount}
        className="px-16 py-3.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-cyan-400 text-black font-bold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#00D4FF]/30"
      >
        {rolling ? (
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
            Rolling...
          </span>
        ) : (
          "ROLL"
        )}
      </motion.button>

      <div className="text-xs text-slate-600">{gameName} · Payout 2x on over/under · Variable on exact</div>
    </div>
  );
}

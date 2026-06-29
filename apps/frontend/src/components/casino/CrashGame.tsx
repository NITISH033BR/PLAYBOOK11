"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useCasinoPlay } from "@/hooks/useCasinoPlay";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];
const AUTO_CASHOUT_OPTIONS = [1.5, 2, 3, 5, 10];

export function CrashGame({ gameSlug, gameName }: { gameSlug: string; gameName: string }) {
  const { play } = useCasinoPlay();
  const { data: walletData } = useWallet();
  const wallet: any = walletData?.data || walletData;

  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(0);
  const [autoCashOut, setAutoCashOut] = useState(2);
  const [useAutoCashout, setUseAutoCashout] = useState(true);
  const [gameState, setGameState] = useState<"idle" | "betting" | "flying" | "crashed" | "cashed_out">("idle");
  const [currentMult, setCurrentMult] = useState(1);
  const [crashPoint, setCrashPoint] = useState(1);
  const [result, setResult] = useState<any>(null);
  const [hasBet, setHasBet] = useState(false);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (wallet?.balance !== undefined) setBalance(Number(wallet.balance));
  }, [wallet?.balance]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const placeBet = useCallback(async () => {
    if (gameState !== "idle" || betAmount <= 0) return;
    if (betAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setHasBet(true);
    setResult(null);
    setGameState("betting");
    setCurrentMult(1);

    setTimeout(async () => {
      setGameState("flying");
      startTimeRef.current = performance.now();

      try {
        const cashOutAt = useAutoCashout ? autoCashOut : undefined;
        const res: any = await play.mutateAsync({
          gameSlug,
          betAmount,
          betData: { autoCashOut: cashOutAt },
        });
        setResult(res?.result || res);
        const pt = res?.result?.crashPoint || 2;
        setCrashPoint(pt);

        const animate = () => {
          const elapsed = (performance.now() - startTimeRef.current) / 1000;
          const mult = 1 + elapsed * 0.3;
          if (mult < pt) {
            setCurrentMult(mult);
            animRef.current = requestAnimationFrame(animate);
          } else {
            setCurrentMult(pt);
            setGameState("crashed");
            if (res?.balance !== undefined) setBalance(res.balance);
          }
        };
        animRef.current = requestAnimationFrame(animate);
      } catch {
        setGameState("crashed");
        setCrashPoint(1);
        setCurrentMult(1);
      }
    }, 1500);
  }, [gameState, betAmount, balance, gameSlug, play, useAutoCashout, autoCashOut]);

  const cashOut = useCallback(async () => {
    if (gameState !== "flying" || !hasBet) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setGameState("cashed_out");
    setCurrentMult(currentMult);

    try {
      const res: any = await play.mutateAsync({
        gameSlug,
        betAmount,
        betData: { cashOutAt: currentMult },
      });
      setResult(res?.result || res);
      if (res?.balance !== undefined) setBalance(res.balance);
    } catch {
      // handled
    }
  }, [gameState, hasBet, gameSlug, betAmount, play, currentMult]);

  const reset = useCallback(() => {
    setGameState("idle");
    setHasBet(false);
    setCurrentMult(1);
    setResult(null);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  const progress = Math.min(currentMult / 10, 1);
  const hue = 200 - progress * 120;

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
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-4 rounded-3xl blur-xl transition-all duration-500" style={{ background: `rgba(${255 * (1 - progress)}, ${100 * progress}, 0, 0.1)` }} />

        <div className="relative bg-gradient-to-b from-[#172033] via-[#111827] to-[#172033] rounded-2xl border border-slate-700/30 p-8 shadow-2xl overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={{
              background: [
                `linear-gradient(0deg, transparent 0%, hsl(${hue}, 80%, 50%) 50%, transparent 100%)`,
              ],
            }}
            transition={{ duration: 0.5 }}
          />

          <div className="relative flex flex-col items-center justify-center min-h-[220px]">
            <AnimatePresence mode="wait">
              {gameState === "idle" && !hasBet && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <div className="text-6xl mb-4">🚀</div>
                  <p className="text-slate-400 text-sm">Place a bet to start</p>
                </motion.div>
              )}

              {gameState === "betting" && (
                <motion.div key="betting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <span className="h-10 w-10 rounded-full border-2 border-[#00D4FF] border-t-transparent animate-spin inline-block" />
                  <p className="text-slate-400 text-sm mt-2">Waiting for next round...</p>
                </motion.div>
              )}

              {(gameState === "flying" || gameState === "cashed_out") && (
                <motion.div key="flying" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <motion.div
                    animate={gameState === "flying" ? { y: [0, -8, 0] } : {}}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="text-5xl mb-2"
                  >
                    🚀
                  </motion.div>
                  <div className={`text-6xl font-extrabold tabular-nums ${gameState === "cashed_out" ? "text-green-400" : "text-white"}`}>
                    {currentMult.toFixed(2)}x
                  </div>
                  {gameState === "cashed_out" && (
                    <div className="text-green-400 font-bold text-xl mt-2">
                      +${formatCurrency(betAmount * (currentMult - 1))}
                    </div>
                  )}
                </motion.div>
              )}

              {gameState === "crashed" && (
                <motion.div key="crashed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-5xl mb-2"
                  >
                    💥
                  </motion.div>
                  <div className="text-4xl font-extrabold text-red-400">CRASHED</div>
                  <div className="text-2xl text-slate-400 mt-1">{crashPoint.toFixed(2)}x</div>
                  <div className="text-sm text-slate-500 mt-2">
                    {result?.isWin ? "You cashed out!" : "Bet lost"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${Math.min(progress * 100, 100)}%`,
                background: `linear-gradient(90deg, #00D4FF, hsl(${hue}, 80%, 50%))`,
              }}
            />
          </div>

          <div className="mt-2 flex justify-between text-[10px] text-slate-600">
            <span>1x</span>
            <span>2x</span>
            <span>5x</span>
            <span>10x</span>
          </div>
        </div>
      </div>

      {gameState === "idle" && (
        <>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-slate-400 mr-1">Auto cashout:</span>
            {AUTO_CASHOUT_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => { setAutoCashOut(m); setUseAutoCashout(true); }}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                  useAutoCashout && autoCashOut === m
                    ? "bg-[#00D4FF] text-black shadow-lg shadow-[#00D4FF]/30"
                    : "bg-[#172033] text-slate-400 hover:text-white border border-slate-600/30"
                }`}
              >
                {m}x
              </button>
            ))}
            <button
              onClick={() => setUseAutoCashout(false)}
              className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                !useAutoCashout
                  ? "bg-[#00D4FF] text-black shadow-lg shadow-[#00D4FF]/30"
                  : "bg-[#172033] text-slate-400 hover:text-white border border-slate-600/30"
              }`}
            >
              Manual
            </button>
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
        </>
      )}

      <div className="flex gap-3">
        {gameState === "idle" && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={placeBet}
            disabled={balance < betAmount}
            className="px-16 py-3.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-cyan-400 text-black font-bold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#00D4FF]/30"
          >
            BET
          </motion.button>
        )}

        {gameState === "flying" && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={cashOut}
            className="px-16 py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-lg hover:brightness-110 shadow-lg shadow-green-500/30"
          >
            CASH OUT ({(betAmount * currentMult).toFixed(2)})
          </motion.button>
        )}

        {(gameState === "crashed" || gameState === "cashed_out") && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={reset}
            className="px-16 py-3.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-cyan-400 text-black font-bold text-lg hover:brightness-110 transition-all shadow-lg shadow-[#00D4FF]/30"
          >
            BET AGAIN
          </motion.button>
        )}
      </div>

      <div className="text-xs text-slate-600">{gameName} · Cash out before the crash</div>
    </div>
  );
}

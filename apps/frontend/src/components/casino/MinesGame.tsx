"use client";

import { useState, useCallback, useEffect } from "react";
import { useCasinoPlay } from "@/hooks/useCasinoPlay";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];
const MINE_OPTIONS = [1, 3, 5, 10, 15];

export function MinesGame({ gameSlug, gameName }: { gameSlug: string; gameName: string }) {
  const { play } = useCasinoPlay();
  const { data: walletData } = useWallet();
  const wallet: any = walletData?.data || walletData;

  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(0);
  const [mineCount, setMineCount] = useState(3);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [gameResult, setGameResult] = useState<any>(null);
  const [gameOver, setGameOver] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (wallet?.balance !== undefined) setBalance(Number(wallet.balance));
  }, [wallet?.balance]);

  const startGame = useCallback(async () => {
    if (playing || betAmount <= 0) return;
    if (betAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }
    setRevealed([]);
    setGameResult(null);
    setGameOver(false);
    setPlaying(true);
  }, [playing, betAmount, balance]);

  const revealTile = useCallback(async (pos: number) => {
    if (gameOver || revealed.includes(pos) || !playing) return;

    const newRevealed = [...revealed, pos];
    setRevealed(newRevealed);

    try {
      const res: any = await play.mutateAsync({
        gameSlug,
        betAmount,
        betData: { mineCount, revealCount: newRevealed.length, revealPositions: newRevealed },
      });
      if (res?.balance !== undefined) setBalance(res.balance);
      setGameResult(res?.result || res);
      if (res?.result?.exploded) {
        setGameOver(true);
      } else if (res?.result && newRevealed.length >= 24 - mineCount) {
        setGameOver(true);
      }
    } catch {
      setPlaying(false);
    }
  }, [gameOver, revealed, playing, gameSlug, betAmount, play, mineCount]);

  const cashOut = useCallback(async () => {
    if (!gameResult || gameOver || !playing || play.isPending) return;
    try {
      const res: any = await play.mutateAsync({
        gameSlug,
        betAmount,
        betData: { mineCount, revealCount: revealed.length, revealPositions: revealed, action: "cashout" },
      });
      if (res?.balance !== undefined) setBalance(res.balance);
      setGameResult(res?.result || res);
      setGameOver(true);
      if (res?.result?.winAmount > 0) {
        toast.success(`Cashed out at ${res.result.multiplier}x`);
      }
    } catch {
      // handled
    }
  }, [gameResult, gameOver, playing, play, gameSlug, betAmount, mineCount, revealed]);

  const multiplier = gameResult?.multiplier || 1;
  const exploded = gameResult?.exploded;
  const tileSize = 3.5;

  const getTileIcon = (pos: number) => {
    if (!gameOver && revealed.includes(pos)) return "💎";
    if (gameOver && exploded && revealed.includes(pos)) return "💥";
    if (gameOver && !revealed.includes(pos) && gameResult?.minePositions?.includes(pos)) return "💣";
    if (gameOver && revealed.includes(pos)) return "💎";
    return null;
  };

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
        {gameResult && !exploded && (
          <div className="glass-card rounded-lg px-4 py-2 text-sm">
            <span className="text-slate-400">Multiplier </span>
            <span className="font-bold text-green-400">{multiplier.toFixed(2)}x</span>
          </div>
        )}
      </div>

      <div className={`${gameOver && exploded ? "opacity-50" : ""}`}>
        <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
          {Array.from({ length: 25 }, (_, i) => {
            const isRevealed = revealed.includes(i);
            const isExploded = gameOver && exploded && isRevealed;
            const isMine = gameOver && !isRevealed;
            const gem = getTileIcon(i);

            let tileClasses = "w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-300 ";
            if (isExploded) {
              tileClasses += "bg-red-500/20 border-red-500/50 shadow-red-500/20 shadow-lg";
            } else if (isRevealed) {
              tileClasses += "bg-green-500/20 border-green-500/30 shadow-green-500/10 shadow-lg";
            } else if (gameOver) {
              tileClasses += "bg-slate-700/30 border-slate-600/20";
            } else {
              tileClasses += "bg-[#172033] border-slate-600/30 hover:border-[#00D4FF]/50 hover:bg-[#1e2a45] cursor-pointer active:scale-95";
            }

            return (
              <motion.button
                key={i}
                whileHover={!isRevealed && !gameOver ? { scale: 1.05 } : {}}
                whileTap={!isRevealed && !gameOver ? { scale: 0.95 } : {}}
                onClick={() => revealTile(i)}
                disabled={isRevealed || gameOver || !playing || play.isPending}
                className={tileClasses}
              >
                {gem && <span>{gem}</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-lg font-bold ${exploded ? "text-red-400" : "text-green-400"}`}
          >
            {exploded ? "💥 Hit a mine! Lost" : `✓ Cashed out: $${formatCurrency(gameResult?.winAmount || 0)}`}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-xs text-slate-400 mr-1">Mines:</span>
        {MINE_OPTIONS.map((m) => (
          <button
            key={m}
            onClick={() => setMineCount(m)}
            disabled={playing}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
              mineCount === m
                ? "bg-[#00D4FF] text-black shadow-lg shadow-[#00D4FF]/30"
                : "bg-[#172033] text-slate-400 hover:text-white border border-slate-600/30"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        {BET_AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => setBetAmount(a)}
            disabled={playing}
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

      <div className="flex gap-3">
        {!playing ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startGame}
            disabled={balance < betAmount}
            className="px-16 py-3.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-cyan-400 text-black font-bold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#00D4FF]/30"
          >
            START GAME
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={cashOut}
            disabled={revealed.length === 0 || gameOver || play.isPending}
            className="px-16 py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/30"
          >
            CASH OUT ({(multiplier * betAmount).toFixed(2)})
          </motion.button>
        )}
      </div>

      <div className="text-xs text-slate-600">{gameName} · Reveal gems, avoid mines</div>
    </div>
  );
}

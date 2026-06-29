"use client";

import { useRef } from "react";
import { useCasinoWinners } from "@/hooks/useCasino";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const WIN_EMOJIS = ["🎉", "💰", "🔥", "⭐", "💎", "🏆", "👑", "💸"];

function getWinAmount(winner: any): number {
  if (winner.winAmount) return Number(winner.winAmount);
  if (winner.amount) return Number(winner.amount);
  if (winner.win) return Number(winner.win);
  return 0;
}

function getUserName(winner: any): string {
  return winner.user?.username || winner.username || winner.user?.displayName || winner.displayName || "Player";
}

function getGameSlug(winner: any): string {
  return winner.gameSlug || winner.game?.slug || winner.slug || "";
}

export function WinnerFeed({ limit = 5, compact = false }: { limit?: number; compact?: boolean }) {
  const { data: winnersData } = useCasinoWinners(limit);
  const winners = winnersData?.data || winnersData || [];

  if (!winners.length) return null;

  const display = winners.slice(0, limit);

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {display.map((w: any, i: number) => {
            const amt = getWinAmount(w);
            return (
              <motion.div
                key={w.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 text-xs py-1"
              >
                <span>{WIN_EMOJIS[i % WIN_EMOJIS.length]}</span>
                <span className="text-slate-300 truncate max-w-[80px]">{getUserName(w)}</span>
                <span className="text-green-400 font-bold ml-auto">${formatCurrency(amt)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">🏆 Recent Winners</h3>
      <div className="overflow-hidden">
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {display.map((w: any, i: number) => {
              const amt = getWinAmount(w);
              const isBigWin = amt >= 1000;
              return (
                <motion.div
                  key={w.id || i}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass-card rounded-xl px-4 py-3 flex items-center gap-3 ${
                    isBigWin ? "ring-1 ring-yellow-500/30" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                    isBigWin ? "bg-yellow-500/20" : "bg-[#172033]"
                  }`}>
                    {isBigWin ? "👑" : WIN_EMOJIS[i % WIN_EMOJIS.length]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{getUserName(w)}</span>
                      {isBigWin && (
                        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">BIG WIN</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{getGameSlug(w)}</div>
                  </div>
                  <div className={`text-right ${isBigWin ? "text-yellow-400" : "text-green-400"} font-bold`}>
                    ${formatCurrency(amt)}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

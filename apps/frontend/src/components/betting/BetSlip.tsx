"use client";

import { useBetSlipStore } from "@/store/betSlipStore";
import { useUIStore } from "@/store/uiStore";
import { usePlaceBet } from "@/hooks/useBets";
import { usePlaceLiveBet } from "@/hooks/useOdds";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function BetSlip() {
  const {
    selections,
    stake,
    betType,
    setStake,
    setBetType,
    removeSelection,
    clearBetSlip,
  } = useBetSlipStore();
  const { betSlipOpen, closeBetSlip } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const placeBet = usePlaceBet();
  const placeLiveBet = usePlaceLiveBet();

  const isLiveBet = selections.some((s) => s.source === "live");
  const totalOdds = selections.reduce((acc, s) => acc * s.oddsValue, 1);
  const potentialWin = stake * totalOdds;
  const isPending = isLiveBet ? placeLiveBet.isPending : placeBet.isPending;

  const handlePlaceBet = () => {
    if (!stake || stake <= 0) return;
    if (isLiveBet) {
      const sel = selections[0];
      placeLiveBet.mutate(
        {
          eventId: sel.matchId,
          marketKey: sel.marketId,
          outcomeName: sel.label,
          odds: sel.oddsValue,
          stake,
        },
        { onSuccess: () => clearBetSlip() },
      );
    } else {
      placeBet.mutate(
        {
          stake,
          type: betType,
          legs: selections.map((s) => ({
            marketId: s.marketId,
            oddsId: s.oddsId,
          })),
        },
        { onSuccess: () => clearBetSlip() },
      );
    }
  };

  return (
    <AnimatePresence>
      {betSlipOpen && (
        <>
          {/* Overlay for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeBetSlip}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-40 h-full w-80 border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl overflow-y-auto shadow-2xl shadow-black/40"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h2 className="text-lg font-bold text-white">Bet Slip</h2>
                </div>
                <button onClick={closeBetSlip} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              {selections.length === 0 ? (
                <div className="mt-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
                    <svg className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 000-2" />
                    </svg>
                  </div>
                  <p className="text-slate-400 font-medium">Your bet slip is empty</p>
                  <p className="mt-1 text-sm text-slate-500">Click on odds to add selections</p>
                  <Link
                    href="/sports"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/20"
                    onClick={closeBetSlip}
                  >
                    <span>⚽</span>
                    Browse Sports
                  </Link>
                </div>
              ) : (
                <>
                  {/* Selections */}
                  <div className="space-y-2">
                    {selections.map((sel) => (
                      <motion.div
                        key={sel.oddsId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400 truncate">{sel.matchName}</p>
                            <p className="text-sm font-medium text-white truncate mt-0.5">{sel.label}</p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{sel.marketName}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-sm font-bold text-cyan-400">{Number(sel.oddsValue).toFixed(2)}</span>
                            <button onClick={() => removeSelection(sel.oddsId)} className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Bet Type */}
                  {selections.length > 1 && (
                    <div className="mt-4 flex gap-2">
                      {["SINGLE", "MULTI"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setBetType(type as "SINGLE" | "MULTI")}
                          className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition-all ${
                            betType === type
                              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                              : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                          }`}
                        >
                          {type === "SINGLE" ? "Single" : `Multi (${selections.length} legs)`}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Stake & Summary */}
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Stake Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                        <input
                          type="number"
                          value={stake || ""}
                          onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="input pl-7 text-lg font-bold"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Total Odds</span>
                        <span className="text-white font-bold">{Number(totalOdds).toFixed(2)}</span>
                      </div>
                      {stake > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Potential Win</span>
                          <span className="text-green-400 font-bold">${formatCurrency(potentialWin)}</span>
                        </div>
                      )}
                    </div>

                    {isAuthenticated ? (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePlaceBet}
                        disabled={!stake || stake <= 0 || isPending}
                        className="btn-accent w-full text-base font-bold h-12 disabled:opacity-50 shadow-lg shadow-green-500/20"
                      >
                        {placeBet.isPending ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Placing Bet...
                          </span>
                        ) : `Place Bet (${betType === "MULTI" ? "Multi" : "Single"})`}
                      </motion.button>
                    ) : (
                      <Link
                        href="/login"
                        className="btn-accent flex w-full items-center justify-center text-base font-bold h-12 shadow-lg shadow-green-500/20"
                        onClick={closeBetSlip}
                      >
                        Login to Bet
                      </Link>
                    )}

                    <button onClick={clearBetSlip} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors py-1">
                      Clear All Selections
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

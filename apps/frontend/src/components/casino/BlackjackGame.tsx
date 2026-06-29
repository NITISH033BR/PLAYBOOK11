"use client";

import { useState, useCallback, useEffect } from "react";
import { useCasinoPlay } from "@/hooks/useCasinoPlay";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠",
};

const SUIT_COLORS: Record<string, string> = {
  hearts: "text-red-500", diamonds: "text-red-500", clubs: "text-slate-100", spades: "text-slate-100",
};

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];

function CardView({ card, hidden }: { card: string; hidden?: boolean }) {
  if (hidden || !card) {
    return (
      <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl bg-gradient-to-br from-[#00D4FF]/40 to-cyan-700/40 border border-[#00D4FF]/30 flex items-center justify-center shadow-lg">
        <span className="text-xl sm:text-2xl">🂠</span>
      </div>
    );
  }
  const [rank, suit] = card.split("-");
  const color = SUIT_COLORS[suit] || "text-slate-100";
  const sym = SUIT_SYMBOLS[suit] || "?";
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`w-14 h-20 sm:w-16 sm:h-24 rounded-xl bg-white/10 backdrop-blur-sm border border-slate-600/50 flex flex-col items-center justify-center shadow-lg ${color}`}
    >
      <span className="text-base sm:text-lg font-bold leading-none">{rank}</span>
      <span className="text-lg sm:text-xl leading-none">{sym}</span>
    </motion.div>
  );
}

function HandView({ cards, label, value, hiddenFirst }: { cards: string[]; label: string; value?: number; hiddenFirst?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm text-slate-400">
        {label}
        {value !== undefined && (
          <span className="ml-2 font-bold text-white">({value})</span>
        )}
      </div>
      <div className="flex gap-1.5 sm:gap-2">
        {cards.map((card, i) => (
          <CardView key={i} card={card} hidden={hiddenFirst && i === 0} />
        ))}
      </div>
    </div>
  );
}

export function BlackjackGame({ gameSlug, gameName }: { gameSlug: string; gameName: string }) {
  const { play, hit, stand } = useCasinoPlay();
  const { data: walletData } = useWallet();
  const wallet: any = walletData?.data || walletData;

  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [playerCards, setPlayerCards] = useState<string[]>([]);
  const [dealerCards, setDealerCards] = useState<string[]>([]);
  const [playerValue, setPlayerValue] = useState(0);
  const [dealerValue, setDealerValue] = useState<number | undefined>(undefined);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [winAmount, setWinAmount] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wallet?.balance !== undefined) setBalance(Number(wallet.balance));
  }, [wallet?.balance]);

  const startGame = useCallback(async () => {
    if (betAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }
    setLoading(true);
    try {
      const res: any = await play.mutateAsync({
        gameSlug,
        betAmount,
        betData: { type: "blackjack" },
      });
      const r = res?.result;
      if (r) {
        setSessionId(res.sessionId);
        setPlayerCards(r.playerCards || []);
        setDealerCards(r.dealerCards || []);
        setPlayerValue(r.playerValue || 0);
        setDealerValue(r.dealerValue);
        setGameOver(!r.isActive);
        setWinAmount(r.winAmount || 0);
        setStarted(true);
        if (res.balance !== undefined) setBalance(res.balance);
        if (r.natural) {
          setMessage(r.winAmount > betAmount ? "Blackjack! You win!" : "Push - Both have Blackjack");
        } else {
          setMessage("");
        }
      }
    } catch {
      // handled by hook
    } finally {
      setLoading(false);
    }
  }, [betAmount, balance, gameSlug, play]);

  const handleHit = useCallback(async () => {
    if (!sessionId || loading) return;
    setLoading(true);
    try {
      const res: any = await hit.mutateAsync(sessionId);
      const r = res;
      if (r) {
        setPlayerCards(r.playerCards || []);
        setPlayerValue(r.playerValue || 0);
        if (r.status === "LOST" || r.message === "Bust") {
          setGameOver(true);
          setMessage("Bust! You lose");
          setWinAmount(0);
        }
        if (r.balance !== undefined) setBalance(r.balance);
      }
    } catch {
      // handled by hook
    } finally {
      setLoading(false);
    }
  }, [sessionId, loading, hit]);

  const handleStand = useCallback(async () => {
    if (!sessionId || loading) return;
    setLoading(true);
    try {
      const res: any = await stand.mutateAsync(sessionId);
      const r = res;
      if (r) {
        setPlayerCards(r.playerCards || []);
        setDealerCards(r.dealerCards || []);
        setDealerValue(r.dealerValue);
        setGameOver(true);
        setWinAmount(r.winAmount || 0);
        setMessage(r.message || "");
        if (r.balance !== undefined) setBalance(r.balance);
      }
    } catch {
      // handled by hook
    } finally {
      setLoading(false);
    }
  }, [sessionId, loading, stand]);

  const reset = () => {
    setSessionId(null);
    setPlayerCards([]);
    setDealerCards([]);
    setPlayerValue(0);
    setDealerValue(undefined);
    setGameOver(false);
    setMessage("");
    setWinAmount(0);
    setStarted(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Info Bar */}
      <div className="flex items-center justify-center gap-6 flex-wrap">
        <div className="glass-card rounded-lg px-4 py-2 text-sm">
          <span className="text-slate-400">Balance </span>
          <span className="font-bold text-white">${formatCurrency(balance)}</span>
        </div>
        {started && (
          <div className="glass-card rounded-lg px-4 py-2 text-sm">
            <span className="text-slate-400">Bet </span>
            <span className="font-bold text-[#00D4FF]">${formatCurrency(betAmount)}</span>
          </div>
        )}
        <AnimatePresence>
          {gameOver && winAmount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="glass-card rounded-lg px-4 py-2 text-sm"
            >
              <span className="text-green-400 font-bold text-lg">+${formatCurrency(winAmount)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!started ? (
        /* Pre-game: Bet selection */
        <div className="flex flex-col items-center gap-6">
          <div className="text-6xl">🃏</div>
          <h2 className="text-2xl font-bold text-white">{gameName}</h2>
          <p className="text-slate-400 text-sm">Place your bet to begin</p>
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
            onClick={startGame}
            disabled={loading || balance < betAmount}
            className="px-16 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 text-white font-bold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/30"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Dealing...
              </span>
            ) : (
              "Deal Cards"
            )}
          </motion.button>
        </div>
      ) : (
        /* Game in progress */
        <>
          {/* Dealer Hand */}
          <HandView
            cards={dealerCards}
            label="Dealer"
            value={gameOver ? dealerValue : undefined}
            hiddenFirst={!gameOver}
          />

          {/* Divider */}
          <div className="w-full max-w-xs border-t border-slate-700/30" />

          {/* Player Hand */}
          <HandView cards={playerCards} label="Your Hand" value={playerValue} />

          {/* Message */}
          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`text-xl font-bold ${
                  winAmount > betAmount
                    ? "text-green-400"
                    : winAmount === betAmount
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          {!gameOver ? (
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleHit}
                disabled={loading}
                className="px-10 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-green-500/30"
              >
                {loading ? "..." : "Hit"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStand}
                disabled={loading}
                className="px-10 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-red-500/30"
              >
                {loading ? "..." : "Stand"}
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={reset}
              className="px-10 py-3 rounded-xl bg-gradient-to-r from-[#00D4FF] to-cyan-400 text-black font-bold hover:brightness-110 transition-all shadow-lg shadow-[#00D4FF]/30"
            >
              Play Again
            </motion.button>
          )}
        </>
      )}

      <div className="text-xs text-slate-600">{gameName} · Min $1 · Max $100</div>
    </div>
  );
}

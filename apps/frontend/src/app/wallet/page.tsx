"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet, useDeposit, useWithdraw, useTransactions } from "@/hooks/useWallet";
import { cn, formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const paymentMethods = [
  { id: "UPI", label: "UPI", icon: "📱" },
  { id: "BANK", label: "Bank Transfer", icon: "🏦" },
  { id: "CRYPTO", label: "Crypto", icon: "₿" },
];

const quickAmounts = [100, 500, 1000, 5000, 10000];

const txTypeFilters = ["ALL", "DEPOSIT", "WITHDRAWAL", "BET_PLACED", "BET_WON", "BET_LOST", "BET_CASHED_OUT", "TRANSFER_IN", "TRANSFER_OUT", "COMMISSION", "REFERRAL_BONUS", "ADMIN_ADJUST"];

export default function WalletPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<"overview" | "deposit" | "withdraw">(
    tabParam === "withdraw" ? "withdraw" : "overview"
  );
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("UPI");
  const [txPage, setTxPage] = useState(1);
  const [txType, setTxType] = useState<string>("ALL");
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: walletData, isLoading: walletLoading } = useWallet();
  const { data: txData, isLoading: txLoading } = useTransactions({ page: txPage, limit: 20 });
  const deposit = useDeposit();
  const withdraw = useWithdraw();

  const wallet = walletData?.data || walletData;
  const transactions = txData?.data?.data || txData?.data || txData || [];
  const meta = txData?.data?.meta || txData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const totalDeposits = Array.isArray(transactions) ? transactions.filter((t: any) => t.type === "DEPOSIT").reduce((s: number, t: any) => s + Number(t.amount), 0) : 0;
  const totalWithdrawals = Array.isArray(transactions) ? transactions.filter((t: any) => t.type === "WITHDRAWAL").reduce((s: number, t: any) => s + Number(t.amount), 0) : 0;
  const totalBetsPlaced = Array.isArray(transactions) ? transactions.filter((t: any) => t.type === "BET_PLACED").reduce((s: number, t: any) => s + Number(t.amount), 0) : 0;
  const totalBetsWon = Array.isArray(transactions) ? transactions.filter((t: any) => t.type === "BET_WON").reduce((s: number, t: any) => s + Number(t.amount), 0) : 0;
  const pnl = totalBetsWon - totalBetsPlaced;
  const availableBalance = Math.max(0, Number(wallet?.balance || 0) - Number(wallet?.locked || 0));

  const filteredTx = Array.isArray(transactions)
    ? txType === "ALL" ? transactions : transactions.filter((t: any) => t.type === txType)
    : [];

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (amount > 0) deposit.mutate({ amount }, { onSuccess: () => setDepositAmount("") });
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (amount > 0) withdraw.mutate({ amount }, { onSuccess: () => setWithdrawAmount("") });
  };

  return (
    <motion.div className="mx-auto max-w-3xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your funds and transactions</p>
      </div>

      {/* Balance Dashboard */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-600/20 to-cyan-700/10 border border-cyan-500/20 p-6 min-w-0"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
          <div className="relative z-10 min-w-0">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Available Balance</div>
            <div className="mt-1.5 font-bold text-white text-2xl sm:text-3xl min-w-0 overflow-hidden">
              <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
                ${formatCurrency(availableBalance, { compact: true })}
              </span>
            </div>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Balance", value: wallet?.balance || 0, color: "text-white" },
            { label: "Bonus", value: wallet?.bonus || 0, color: "text-green-400" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 min-w-0"
            >
              <div className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</div>
              <div className={cn("mt-1 font-bold", item.color, "text-lg sm:text-xl min-w-0 overflow-hidden")}>
                <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
                  ${formatCurrency(item.value, { compact: true })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm overflow-hidden">
        <div className="flex border-b border-slate-700/50">
          {[
            { id: "deposit", label: "Deposit", icon: "💰" },
            { id: "withdraw", label: "Withdraw", icon: "💸" },
            { id: "overview", label: "History", icon: "📋" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`flex-1 px-4 py-4 text-sm font-medium transition-all relative ${
                tab === t.id
                  ? "text-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
              {tab === t.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                />
              )}
            </button>
          ))}
        </div>

        <div ref={contentRef} className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
          <div className="p-5">
            {/* Deposit */}
            {tab === "deposit" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-lg font-semibold text-white mb-5">Deposit Funds</h2>

                <div className="mb-5">
                  <label className="text-sm text-slate-400 mb-2.5 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setDepositMethod(method.id)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border py-4 text-sm font-medium transition-all ${
                          depositMethod === method.id
                            ? "border-cyan-500 bg-cyan-600/15 text-cyan-400 shadow-lg shadow-cyan-500/10"
                            : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white bg-slate-800/30"
                        }`}
                      >
                        <span className="text-xl">{method.icon}</span>
                        <span>{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-sm text-slate-400 mb-2.5 block">Quick Amount</label>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDepositAmount(String(amt))}
                        className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                          depositAmount === String(amt)
                            ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                            : "bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        ${amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleDeposit} className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">Enter Amount</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="input text-lg font-bold pl-7"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={deposit.isPending || !depositAmount}
                    className="w-full rounded-xl bg-cyan-600 py-3.5 text-center text-base font-bold text-white hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                  >
                    {deposit.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                      </span>
                    ) : "Deposit Funds"}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* Withdraw */}
            {tab === "withdraw" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-lg font-semibold text-white mb-5">Withdraw Funds</h2>

                <div className="mb-5 rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 backdrop-blur-sm">
                  <div className="text-sm text-slate-400">Available for withdrawal</div>
                  <div className="text-2xl font-bold text-green-400 mt-1">${formatCurrency(availableBalance)}</div>
                </div>

                <div className="mb-5">
                  <label className="text-sm text-slate-400 mb-2.5 block">Quick Amount</label>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setWithdrawAmount(String(amt))}
                        className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                          withdrawAmount === String(amt)
                            ? "bg-green-600 text-white shadow-lg shadow-green-500/20"
                            : "bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        ${amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">Enter Amount</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="input text-lg font-bold pl-7"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={withdraw.isPending || !withdrawAmount}
                    className="w-full rounded-xl bg-green-600 py-3.5 text-center text-base font-bold text-white hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
                  >
                    {withdraw.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                      </span>
                    ) : "Withdraw Funds"}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* History */}
            {tab === "overview" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {transactions.length > 0 && (
                  <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
                    {[
                      { label: "Deposits", value: totalDeposits, color: "text-green-400", bg: "bg-green-400/10" },
                      { label: "Withdrawals", value: totalWithdrawals, color: "text-red-400", bg: "bg-red-500/10" },
                      { label: "Total Bets", value: transactions.filter((t: any) => t.type === "BET_PLACED").length, color: "text-cyan-400", bg: "bg-cyan-600/10" },
                      { label: "P&L", value: pnl, color: pnl >= 0 ? "text-green-400" : "text-red-400", bg: pnl >= 0 ? "bg-green-400/10" : "bg-red-500/10" },
                    ].map((stat) => (
                      <div key={stat.label} className={cn("rounded-xl p-4 text-center border border-slate-700/30 min-w-0", stat.bg)}>
                        <div className="text-xs uppercase tracking-wider text-slate-400">{stat.label}</div>
                        <div className={cn("mt-1 font-bold", stat.color, "text-lg min-w-0 overflow-hidden")}>
                          <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)' }}>
                            {stat.label === "Total Bets" ? stat.value : (stat.label === "P&L" ? `${pnl >= 0 ? "+" : ""}` : "")}${formatCurrency(stat.value, { compact: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-4 flex flex-wrap gap-2">
                  {txTypeFilters.map((type) => (
                    <button
                      key={type}
                      onClick={() => setTxType(type)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        txType === type
                          ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                          : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                      }`}
                    >
                      {type === "ALL" ? "All" : type.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>

                {txLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton h-12 w-full" />
                    ))}
                  </div>
                ) : filteredTx.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50 text-left text-slate-500">
                          <th className="pb-3 pr-4 font-medium">Type</th>
                          <th className="pb-3 pr-4 text-right font-medium">Amount</th>
                          <th className="pb-3 pr-4 text-center font-medium">Status</th>
                          <th className="pb-3 pr-4 text-right font-medium">Balance</th>
                          <th className="pb-3 text-right font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTx.map((tx: any) => (
                          <tr key={tx.id} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 pr-4">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                tx.type === "DEPOSIT" ? "bg-green-400/15 text-green-400" :
                                tx.type === "WITHDRAWAL" ? "bg-red-500/15 text-red-400" :
                                tx.type === "BET_WON" ? "bg-cyan-600/15 text-cyan-400" :
                                tx.type === "BET_LOST" ? "bg-orange-500/15 text-orange-400" :
                                tx.type === "BET_PLACED" ? "bg-amber-500/15 text-amber-400" :
                                tx.type === "COMMISSION" ? "bg-purple-500/15 text-purple-400" :
                                tx.type === "TRANSFER_IN" ? "bg-emerald-500/15 text-emerald-400" :
                                tx.type === "TRANSFER_OUT" ? "bg-rose-500/15 text-rose-400" :
                                tx.type === "REFERRAL_BONUS" ? "bg-blue-500/15 text-blue-400" :
                                tx.type === "BET_CASHED_OUT" ? "bg-teal-500/15 text-teal-400" :
                                tx.type === "ADMIN_ADJUST" ? "bg-gray-500/15 text-gray-400" :
                                "bg-slate-500/15 text-slate-400"
                              }`}>{tx.type.replace(/_/g, " ")}</span>
                            </td>
                            <td className={cn("py-3 pr-4 text-right font-medium tabular-nums",
                              ["DEPOSIT", "BET_WON", "REFERRAL_BONUS", "COMMISSION", "TRANSFER_IN", "BET_CASHED_OUT"].includes(tx.type) ? "text-green-400" : "text-red-400"
                            )}>
                              {["DEPOSIT", "BET_WON", "REFERRAL_BONUS", "COMMISSION", "TRANSFER_IN", "BET_CASHED_OUT"].includes(tx.type) ? "+" : "-"}${formatCurrency(tx.amount)}
                            </td>
                            <td className="py-3 pr-4 text-center">
                              <span className={cn("text-xs", getStatusColor(tx.status))}>{tx.status}</span>
                            </td>
                            <td className="py-3 pr-4 text-right text-slate-500 tabular-nums">${formatCurrency(tx.balanceAfter)}</td>
                            <td className="py-3 text-right text-slate-500 text-xs">{formatDate(tx.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
                      <span className="text-2xl">💰</span>
                    </div>
                    <p className="text-slate-400">No transactions yet</p>
                    <p className="mt-1 text-sm text-slate-500">Make a deposit to start betting</p>
                  </div>
                )}

                {meta.totalPages > 1 && (
                  <div className="mt-6 flex justify-center gap-2">
                    {Array.from({ length: meta.totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setTxPage(i + 1)}
                        className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                          txPage === i + 1
                            ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                            : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { useWallet, useDeposit, useWithdraw } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const paymentMethods = [
  { id: "UPI", label: "UPI", icon: "📱" },
  { id: "BANK", label: "Bank Transfer", icon: "🏦" },
  { id: "CRYPTO", label: "Crypto", icon: "₿" },
];

const quickAmounts = [100, 500, 1000, 5000, 10000];

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function WalletModal() {
  const { walletModalOpen, closeWalletModal, walletModalTab, setWalletModalTab } = useUIStore();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("UPI");

  const { data: walletData, isLoading: walletLoading } = useWallet();
  const deposit = useDeposit();
  const withdraw = useWithdraw();

  const wallet = walletData?.data || walletData;
  const availableBalance = Math.max(0, Number(wallet?.balance || 0) - Number(wallet?.locked || 0));

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (amount > 0) deposit.mutate({ amount }, { onSuccess: () => { setDepositAmount(""); setWalletModalTab("deposit"); } });
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (amount > 0) withdraw.mutate({ amount }, { onSuccess: () => setWithdrawAmount("") });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeWalletModal();
  };

  return (
    <AnimatePresence>
      {walletModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl shadow-cyan-500/5"
              style={{ maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 shadow-lg shadow-cyan-500/20">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white">Wallet</h2>
                </div>
                <button
                  onClick={closeWalletModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-all"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Hero Banner */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-cyan-600 via-cyan-700 to-blue-900">
                  <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-white/70">Available Balance</p>
                    <p className="text-4xl font-black text-white tracking-tight mt-0.5">
                      {walletLoading ? (
                        <span className="inline-block h-8 w-32 animate-pulse rounded bg-white/10" />
                      ) : (
                        <>${formatCurrency(availableBalance)}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-2 gap-3 px-5 -mt-5 relative z-10 mb-5">
                  {[
                    { label: "Total Balance", value: wallet?.balance || 0, color: "text-white" },
                    { label: "Bonus", value: wallet?.bonus || 0, color: "text-green-400" },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-sm p-4 shadow-lg"
                    >
                      <div className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</div>
                      <div className={cn("mt-1 text-lg font-bold tabular-nums", item.color)}>
                        ${formatCurrency(item.value)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5 px-5 mb-5">
                  {[
                    { id: "deposit" as const, label: "Deposit", icon: "💰" },
                    { id: "withdraw" as const, label: "Withdraw", icon: "💸" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setWalletModalTab(t.id)}
                      className={cn(
                        "flex-1 rounded-xl py-3 text-sm font-bold transition-all relative",
                        walletModalTab === t.id
                          ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                          : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50"
                      )}
                    >
                      <span className="mr-1.5">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="px-5 pb-5">
                  {/* Deposit */}
                  {walletModalTab === "deposit" && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                      {/* Payment Methods */}
                      <div className="mb-5">
                        <label className="text-sm text-slate-400 mb-3 block font-medium">Payment Method</label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {paymentMethods.map((method) => (
                            <button
                              key={method.id}
                              onClick={() => setDepositMethod(method.id)}
                              className={cn(
                                "flex flex-col items-center gap-2 rounded-xl border py-4 text-sm font-medium transition-all",
                                depositMethod === method.id
                                  ? "border-cyan-500 bg-cyan-600/15 text-cyan-400 shadow-lg shadow-cyan-500/10"
                                  : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white bg-slate-800/30"
                              )}
                            >
                              <span className="text-2xl">{method.icon}</span>
                              <span>{method.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quick Amounts */}
                      <div className="mb-5">
                        <label className="text-sm text-slate-400 mb-3 block font-medium">Quick Amount</label>
                        <div className="grid grid-cols-5 gap-2">
                          {quickAmounts.map((amt) => (
                            <button
                              key={amt}
                              onClick={() => setDepositAmount(String(amt))}
                              className={cn(
                                "rounded-xl py-2.5 text-sm font-bold transition-all",
                                depositAmount === String(amt)
                                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                                  : "bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"
                              )}
                            >
                              ${amt.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount Input */}
                      <form onSubmit={handleDeposit}>
                        <div className="mb-5">
                          <label className="text-sm text-slate-400 mb-2 block font-medium">Enter Amount</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                            <input
                              type="number"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-3.5 pl-8 pr-4 text-lg font-bold text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                        </div>

                        {/* Action Button - inside form so it scrolls naturally */}
                        <div className="sticky bottom-0 left-0 right-0 pt-2 pb-1 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={deposit.isPending || !depositAmount}
                            className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 py-3.5 text-center text-base font-bold text-white hover:from-cyan-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                          >
                            {deposit.isPending ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Processing...
                              </span>
                            ) : "Make Deposit"}
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Withdraw */}
                  {walletModalTab === "withdraw" && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                      {/* Available Balance */}
                      <div className="mb-5 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                        <div className="text-sm text-slate-400">Available for withdrawal</div>
                        <div className="text-2xl font-bold text-green-400 mt-1">${formatCurrency(availableBalance)}</div>
                      </div>

                      {/* Quick Amounts */}
                      <div className="mb-5">
                        <label className="text-sm text-slate-400 mb-3 block font-medium">Quick Amount</label>
                        <div className="grid grid-cols-5 gap-2">
                          {quickAmounts.map((amt) => (
                            <button
                              key={amt}
                              onClick={() => {
                                if (amt <= availableBalance) setWithdrawAmount(String(amt));
                              }}
                              className={cn(
                                "rounded-xl py-2.5 text-sm font-bold transition-all",
                                withdrawAmount === String(amt)
                                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                                  : amt > availableBalance
                                  ? "bg-slate-800/40 border border-slate-700/30 text-slate-600 cursor-not-allowed"
                                  : "bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"
                              )}
                            >
                              ${amt.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount Input */}
                      <form onSubmit={handleWithdraw}>
                        <div className="mb-5">
                          <label className="text-sm text-slate-400 mb-2 block font-medium">Enter Amount</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                            <input
                              type="number"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-3.5 pl-8 pr-4 text-lg font-bold text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                              placeholder="0.00"
                              min="0"
                              max={availableBalance}
                              step="0.01"
                              required
                            />
                          </div>
                        </div>

                        {/* Action Button - sticky bottom */}
                        <div className="sticky bottom-0 left-0 right-0 pt-2 pb-1 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={withdraw.isPending || !withdrawAmount || parseFloat(withdrawAmount) > availableBalance}
                            className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 py-3.5 text-center text-base font-bold text-white hover:from-cyan-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
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
                        </div>
                      </form>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

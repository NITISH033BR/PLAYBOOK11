"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { useBetSlipStore } from "@/store/betSlipStore";
import { useUIStore } from "@/store/uiStore";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useWallet } from "@/hooks/useWallet";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const logout = useLogout();
  const { selections } = useBetSlipStore();
  const { toggleBetSlip, toggleSidebar, sidebarOpen, openWalletModal, setWalletModalTab } = useUIStore();
  const { data: unreadData } = useUnreadCount();
  const { data: walletData } = useWallet();

  const wallet = walletData?.data || walletData;
  const unreadCount = unreadData?.data?.count || unreadData?.count || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/casino?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const availableBalance = Math.max(0, Number(wallet?.balance || 0) - Number(wallet?.locked || 0));

  return (
    <header className="sticky top-0 z-50 bg-[#0B1220]/80 backdrop-blur-xl border-b border-slate-700/30">
      <div className="mx-auto flex h-16 items-center justify-between px-4 gap-3">
        {/* Left */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-slate-400 hover:bg-[#172033] hover:text-white transition-all"
          >
            <svg className={cn("h-5 w-5 transition-transform", sidebarOpen && "rotate-90")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#00D4FF] to-cyan-600">
              <span className="text-xs font-black text-black">P</span>
            </div>
            <span className="text-base font-bold text-white">PlayBook</span>
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games, matches..."
              className="w-full rounded-lg border border-slate-600 bg-[#172033]/60 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/50 transition-all"
            />
          </div>
        </form>

        {/* Right */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAuthenticated ? (
            <>
              {/* Wallet */}
              <div className="relative">
                <button
                  onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#172033]/80 border border-slate-600/50 px-3 py-1.5 text-sm hover:bg-[#172033] transition-all"
                >
                  <span className="text-amber-400">💰</span>
                  <span className="font-bold text-white tabular-nums text-sm">${formatCurrency(availableBalance)}</span>
                  <svg className={cn("h-3 w-3 text-slate-500 transition-transform", showWalletDropdown && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {showWalletDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-700 bg-[#111827] p-4 shadow-2xl shadow-black/40 z-50 backdrop-blur-xl"
                    >
                      <div className="mb-3 space-y-1.5 text-sm">
                        {[
                          { label: "Balance", value: wallet?.balance || 0, color: "text-white" },
                          { label: "Bonus", value: wallet?.bonus || 0, color: "text-green-400" },
                          { label: "Locked", value: wallet?.locked || 0, color: "text-amber-400" },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between">
                            <span className="text-slate-400">{item.label}</span>
                            <span className={cn("font-bold", item.color)}>${formatCurrency(item.value)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowWalletDropdown(false); setWalletModalTab("deposit"); openWalletModal(); }}
                          className="flex-1 rounded-lg bg-[#00D4FF] px-3 py-2 text-center text-sm font-medium text-black hover:bg-[#00D4FF]/90 transition-all"
                        >
                          Deposit
                        </button>
                        <button
                          onClick={() => { setShowWalletDropdown(false); setWalletModalTab("withdraw"); openWalletModal(); }}
                          className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-center text-sm font-medium hover:bg-[#172033] transition-all"
                        >
                          Withdraw
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications */}
              <Link href="/notifications" className="relative rounded-lg p-2 text-slate-400 hover:bg-[#172033] hover:text-white transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#00D4FF] text-[10px] font-bold text-black">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-[#172033] transition-all"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00D4FF] to-cyan-600 text-sm font-bold text-black shadow-lg shadow-[#00D4FF]/20">
                    {(user?.displayName || user?.username || "U")[0].toUpperCase()}
                  </span>
                  <span className="hidden lg:block max-w-[100px] truncate">{user?.displayName || user?.username}</span>
                  <svg className="h-3 w-3 text-slate-500 hidden lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {showProfile && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-700 bg-[#111827] py-2 shadow-2xl shadow-black/40 z-50 backdrop-blur-xl"
                    >
                      {[
                        { label: "Profile", href: "/profile", icon: "👤" },
                        { label: "My Bets", href: "/bets", icon: "📋" },
                        { label: "Wallet", icon: "💰" },
                        { label: "Referrals", href: "/referrals", icon: "🔗" },
                        { label: "Leaderboard", href: "/leaderboard", icon: "🏆" },
                      ].map((item) => (
                        "href" in item ? (
                          <Link key={item.label} href={(item as any).href} onClick={() => setShowProfile(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-[#172033]/50 transition-colors"
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        ) : (
                          <button key={item.label} onClick={() => { setShowProfile(false); openWalletModal(); }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-[#172033]/50 transition-colors text-left"
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        )
                      ))}
                      {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
                        <Link href="/admin" onClick={() => setShowProfile(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-400 hover:bg-[#172033]/50 transition-colors"
                        >
                          <span>⚙️</span>
                          <span>Admin</span>
                        </Link>
                      )}
                      {user?.role === "USER" && (
                        <Link href="/player" onClick={() => setShowProfile(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-green-400 hover:bg-[#172033]/50 transition-colors"
                        >
                          <span>🎮</span>
                          <span>Dashboard</span>
                        </Link>
                      )}
                      {user?.role === "MASTER_ID" && (
                        <Link href="/master" onClick={() => setShowProfile(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#00D4FF] hover:bg-[#172033]/50 transition-colors"
                        >
                          <span>📊</span>
                          <span>Master Panel</span>
                        </Link>
                      )}
                      {user?.role === "AGENT" && (
                        <Link href="/agent" onClick={() => setShowProfile(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-green-400 hover:bg-[#172033]/50 transition-colors"
                        >
                          <span>👥</span>
                          <span>Agent Panel</span>
                        </Link>
                      )}
                      <hr className="my-2 border-slate-700" />
                      <button onClick={() => { setShowProfile(false); logout.mutate(); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-[#172033]/50 transition-colors"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-[#172033] transition-all">
                Login
              </Link>
              <Link href="/register" className="rounded-lg bg-[#00D4FF] px-4 py-2 text-sm font-medium text-black hover:bg-[#00D4FF]/90 transition-all shadow-lg shadow-[#00D4FF]/20">
                Register
              </Link>
            </div>
          )}

          {/* Bet Slip */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleBetSlip}
            className="relative rounded-lg bg-[#00D4FF]/10 px-3 py-2 text-sm font-medium text-[#00D4FF] hover:bg-[#00D4FF]/20 transition-all border border-[#00D4FF]/20"
          >
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">Bet Slip</span>
            </span>
            {selections.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#00D4FF] text-[10px] font-bold text-black shadow-lg shadow-[#00D4FF]/30"
              >
                {selections.length}
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}

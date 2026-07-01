"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const sportItems = [
  { label: "Cricket", href: "/sports/cricket", icon: "🏏" },
  { label: "Football", href: "/sports/football", icon: "⚽" },
  { label: "Tennis", href: "/sports/tennis", icon: "🎾" },
  { label: "Basketball", href: "/sports/basketball", icon: "🏀" },
  { label: "Baseball", href: "/sports/baseball", icon: "⚾" },
  { label: "MMA", href: "/sports/mma", icon: "🥊" },
];

const casinoItems = [
  { label: "All Games", href: "/casino", icon: "🎰" },
  { label: "Slots", href: "/casino?category=slots", icon: "🎰" },
  { label: "Live Casino", href: "/casino?category=live-casino", icon: "📺" },
  { label: "Roulette", href: "/casino?category=roulette", icon: "🎡" },
  { label: "Blackjack", href: "/casino?category=blackjack", icon: "🃏" },
  { label: "Poker", href: "/casino?category=poker", icon: "♠️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, openBetSlip } = useUIStore();
  const { user, isAuthenticated } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, sidebarOpen]);

  const isActive = (href: string) => {
    const hrefPath = href.includes('?') ? href.substring(0, href.indexOf('?')) : href;
    const hrefQuery = href.includes('?') ? new URLSearchParams(href.substring(href.indexOf('?'))) : null;
    if (href.startsWith("/casino")) return pathname.startsWith("/casino");
    if (href.startsWith("/sports")) return pathname.startsWith("/sports");
    if (href === "/") return pathname === "/";
    if (hrefPath !== pathname) return false;
    if (hrefQuery) {
      if (typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        for (const [key, value] of hrefQuery) {
          if (currentParams.get(key) !== value) return false;
        }
      }
    }
    return true;
  };

  const NavItem = ({ item, index }: { item: { label: string; href: string; icon: string }; index: number }) => {
    const handleClick = () => {
      if (item.href === "#betslip") {
        openBetSlip();
        return;
      }
      if (isMobile) toggleSidebar();
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
      >
        <Link
          href={item.href === "#betslip" ? "/" : item.href}
          onClick={handleClick}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive(item.href)
              ? "bg-[#00D4FF]/10 text-[#00D4FF] border-l-[3px] border-[#00D4FF]"
              : "text-slate-400 hover:text-white hover:bg-[#172033]/80 border-l-[3px] border-transparent",
            !sidebarOpen && !isMobile && "justify-center px-2",
          )}
          title={!sidebarOpen && !isMobile ? item.label : undefined}
        >
          <span className="text-lg shrink-0">{item.icon}</span>
          <AnimatePresence>
            {(sidebarOpen || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="truncate overflow-hidden whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </motion.div>
    );
  };

  const NavSection = ({ title, items, icon }: { title: string; items: { label: string; href: string; icon: string }[]; icon?: string }) => (
    <div className="mb-4">
      {(sidebarOpen || isMobile) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-1 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500"
        >
          {icon} {title}
        </motion.div>
      )}
      {items.map((item, i) => (
        <NavItem key={item.href} item={item} index={i} />
      ))}
    </div>
  );

  return (
    <>
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      <motion.aside
        animate={isMobile ? { x: sidebarOpen ? 0 : -288 } : { width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "flex h-screen flex-col border-r border-slate-700/30 bg-[#0B1220]/95 backdrop-blur-xl shrink-0 overflow-hidden",
          "fixed z-40",
          isMobile ? "w-72" : "lg:relative",
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-slate-700/30 shrink-0",
          (!sidebarOpen && !isMobile) ? "justify-center px-2" : "px-4 justify-between",
        )}>
          {sidebarOpen || isMobile ? (
            <>
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D4FF] to-cyan-600 shadow-lg shadow-[#00D4FF]/20">
                  <span className="text-sm font-black text-black">P</span>
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent"
                >
                  PlayBook
                </motion.span>
              </Link>
              <button onClick={toggleSidebar} className="rounded-lg p-1.5 text-slate-500 hover:bg-[#172033] hover:text-white transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
            </>
          ) : (
            <button onClick={toggleSidebar} className="rounded-lg p-2 text-slate-400 hover:bg-[#172033] hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          )}
        </div>

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 scrollbar-thin">
          <NavSection title="SPORTS" icon="⚽" items={sportItems} />
          <NavSection title="CASINO" icon="🎰" items={casinoItems} />
          {isAuthenticated && user?.role === "USER" && (
            <NavSection title="MY ACCOUNT" icon="🎮" items={[
              { label: "Dashboard", href: "/player", icon: "🎮" },
              { label: "My Bets", href: "/bets", icon: "📋" },
              { label: "Wallet", href: "/wallet", icon: "💰" },
              { label: "Profile", href: "/profile", icon: "👤" },
            ]} />
          )}
          {isAuthenticated && user?.role === "MASTER_ID" && (
            <NavSection title="MANAGEMENT" icon="📊" items={[
              { label: "Dashboard", href: "/master", icon: "📊" },
              { label: "My Agents", href: "/master", icon: "👥" },
              { label: "Create Agent", href: "/master", icon: "➕" },
              { label: "Hierarchy Tree", href: "/master", icon: "🌳" },
            ]} />
          )}
          {isAuthenticated && user?.role === "AGENT" && (
            <NavSection title="MANAGEMENT" icon="👥" items={[
              { label: "Dashboard", href: "/agent", icon: "👥" },
              { label: "My Players", href: "/agent", icon: "🎮" },
              { label: "Create Player", href: "/agent", icon: "➕" },
            ]} />
          )}
          {isAuthenticated && (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
            <NavSection title="ADMIN" icon="⚙️" items={[
              { label: "Dashboard", href: "/admin?tab=dashboard", icon: "📊" },
              { label: "Users", href: "/admin?tab=users", icon: "👥" },
              { label: "Reports", href: "/admin?tab=reports", icon: "📈" },
              { label: "Audit Logs", href: "/admin?tab=audit-logs", icon: "📋" },
              { label: "Hierarchy", href: "/admin?tab=hierarchy", icon: "🌳" },
            ]} />
          )}
        </div>
      </motion.aside>
    </>
  );
}

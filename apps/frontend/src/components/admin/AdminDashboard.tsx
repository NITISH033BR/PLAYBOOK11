'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';

function AnimatedCounter({ value, duration = 2000, className = '' }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <span className={className}>{display.toLocaleString()}</span>;
}

function ResponsiveNumber({ value, isCurrency = false, color = 'white', className = '' }: { value: number; isCurrency?: boolean; color?: string; className?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400', green: 'text-green-400', emerald: 'text-emerald-400',
    purple: 'text-purple-400', indigo: 'text-indigo-400', cyan: 'text-cyan-400',
    yellow: 'text-yellow-400', red: 'text-red-400', orange: 'text-orange-400',
    amber: 'text-amber-400', pink: 'text-pink-400', sky: 'text-sky-400',
    violet: 'text-violet-400', teal: 'text-teal-400', white: 'text-white',
  };
  return (
    <div className={`font-mono min-w-0 overflow-hidden ${className} ${colorMap[color] || 'text-white'}`}>
      <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>
        {isCurrency ? '$' : ''}
        {isCurrency ? formatCurrency(value, { compact: true, decimals: 2 }) : value.toLocaleString()}
      </span>
    </div>
  );
}

function StatCard({ title, value, icon, color, suffix }: { title: string; value: number; icon: string; color: string; suffix?: string }) {
  const isCurrency = title.includes('alance') || title.includes('eposit') || title.includes('ithdrawal') || title.includes('evenue') || title.includes('rofit') || title.includes('ommission') || title.includes('xposure');

  const borderColor = `border-${color}-500/30`;
  const bgBadge = `bg-${color}-500/10`;
  const textBadge = `text-${color}-400`;

  const borderMap: Record<string, string> = {
    blue: 'hover:border-blue-500/30', green: 'hover:border-green-500/30', emerald: 'hover:border-emerald-500/30',
    purple: 'hover:border-purple-500/30', indigo: 'hover:border-indigo-500/30', cyan: 'hover:border-cyan-500/30',
    yellow: 'hover:border-yellow-500/30', red: 'hover:border-red-500/30', orange: 'hover:border-orange-500/30',
    amber: 'hover:border-amber-500/30', pink: 'hover:border-pink-500/30', sky: 'hover:border-sky-500/30',
    violet: 'hover:border-violet-500/30', teal: 'hover:border-teal-500/30',
  };

  const bgMap: Record<string, string> = {
    blue: 'bg-blue-500/10', green: 'bg-green-500/10', emerald: 'bg-emerald-500/10',
    purple: 'bg-purple-500/10', indigo: 'bg-indigo-500/10', cyan: 'bg-cyan-500/10',
    yellow: 'bg-yellow-500/10', red: 'bg-red-500/10', orange: 'bg-orange-500/10',
    amber: 'bg-amber-500/10', pink: 'bg-pink-500/10', sky: 'bg-sky-500/10',
    violet: 'bg-violet-500/10', teal: 'bg-teal-500/10',
  };

  const textMap: Record<string, string> = {
    blue: 'text-blue-400', green: 'text-green-400', emerald: 'text-emerald-400',
    purple: 'text-purple-400', indigo: 'text-indigo-400', cyan: 'text-cyan-400',
    yellow: 'text-yellow-400', red: 'text-red-400', orange: 'text-orange-400',
    amber: 'text-amber-400', pink: 'text-pink-400', sky: 'text-sky-400',
    violet: 'text-violet-400', teal: 'text-teal-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 ${borderMap[color] || 'hover:border-gray-500/30'} transition-all group min-w-0`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl shrink-0">{icon}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bgMap[color] || 'bg-gray-500/10'} ${textMap[color] || 'text-gray-400'} shrink-0 ml-2`}>
          {suffix || 'Today'}
        </span>
      </div>
      <ResponsiveNumber value={value} isCurrency={isCurrency} color={color} />
      <div className="text-xs text-gray-400 uppercase tracking-wider truncate mt-1">{title}</div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="bg-gray-800/50 rounded-xl p-5 h-28">
          <div className="h-4 bg-gray-700 rounded w-16 mb-3" />
          <div className="h-7 bg-gray-700 rounded w-24 mb-2" />
          <div className="h-3 bg-gray-700 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data),
    refetchInterval: 30000,
  });

  const d = data?.data;
  const cards = useMemo(() => [
    { title: 'Total Users', value: d?.totalUsers || 0, icon: '👥', color: 'blue' },
    { title: 'Active Users', value: d?.activeUsers || 0, icon: '✅', color: 'green' },
    { title: 'Online Users', value: d?.onlineUsers || 0, icon: '🟢', color: 'emerald' },
    { title: 'Masters', value: d?.masters || 0, icon: '👑', color: 'purple' },
    { title: 'Agents', value: d?.agents || 0, icon: '🤝', color: 'indigo' },
    { title: 'Players', value: d?.players || 0, icon: '🎮', color: 'cyan' },
    { title: 'Total Wallet Balance', value: d?.totalWalletBalance || 0, icon: '💰', color: 'yellow', suffix: 'Balance' },
    { title: 'Total Deposits', value: d?.totalDeposits || 0, icon: '📥', color: 'green', suffix: 'All Time' },
    { title: 'Total Withdrawals', value: d?.totalWithdrawals || 0, icon: '📤', color: 'red', suffix: 'All Time' },
    { title: "Today's Deposits", value: d?.todayDeposits || 0, icon: '📊', color: 'emerald', suffix: 'Today' },
    { title: "Today's Withdrawals", value: d?.todayWithdrawals || 0, icon: '📊', color: 'orange', suffix: 'Today' },
    { title: 'Total Bets', value: d?.totalBets || 0, icon: '🎲', color: 'blue', suffix: 'All Time' },
    { title: 'Active Bets', value: d?.activeBets || 0, icon: '⚡', color: 'amber', suffix: 'Pending' },
    { title: 'Single Bets', value: d?.casinoBets || 0, icon: '🎲', color: 'pink' },
    { title: 'Multi Bets', value: d?.sportsBets || 0, icon: '🎲', color: 'sky' },
    { title: 'Live Matches', value: d?.liveMatches || 0, icon: '🔴', color: 'red' },
    { title: 'Live Games', value: d?.liveGames || 0, icon: '🕹️', color: 'violet' },
    { title: 'Pending Withdrawals', value: d?.pendingWithdrawals || 0, icon: '⏳', color: 'yellow' },
    { title: 'Pending Deposits', value: d?.pendingDeposits || 0, icon: '⏳', color: 'orange' },
    { title: 'Revenue Today', value: d?.revenueToday || 0, icon: '📈', color: 'green', suffix: 'Today' },
    { title: 'Revenue This Week', value: d?.revenueThisWeek || 0, icon: '📈', color: 'emerald', suffix: 'Week' },
    { title: 'Revenue This Month', value: d?.revenueThisMonth || 0, icon: '📈', color: 'teal', suffix: 'Month' },
    { title: 'Profit / Loss', value: d?.profitLoss || 0, icon: '📊', color: d && d.profitLoss >= 0 ? 'green' : 'red', suffix: 'P&L' },
    { title: 'Exposure', value: d?.exposure || 0, icon: '⚠️', color: 'amber', suffix: 'Risk' },
    { title: 'Commission Paid', value: d?.commissionPaid || 0, icon: '💸', color: 'purple' },
  ], [d]);

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-lg mb-2">Failed to load dashboard data</p>
        <p className="text-sm text-gray-500">Please try again later</p>
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time platform overview and analytics</p>
      </motion.div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

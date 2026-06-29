"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { hierarchyApi, betsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

const betStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  WON: "bg-green-500/20 text-green-400",
  LOST: "bg-red-500/20 text-red-400",
  CANCELLED: "bg-gray-500/20 text-gray-400",
  CASHED_OUT: "bg-blue-500/20 text-blue-400",
};

export default function PlayerPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.push("/login?redirect=/player");
    }
  }, [hydrated, isAuthenticated, router]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["player", "dashboard"],
    queryFn: () => hierarchyApi.getPlayerDashboard().then((r) => r.data),
    enabled: hydrated && isAuthenticated,
  });

  const { data: betsData } = useQuery({
    queryKey: ["player", "bets"],
    queryFn: () => betsApi.getBets({ page: 1, limit: 5 }).then((r) => r.data),
    enabled: hydrated && isAuthenticated,
  });

  const dashboard = dashboardData?.data || dashboardData;
  const recentBets = dashboard?.recentBets || betsData?.data?.data || betsData?.data || [];
  const recentTransactions = dashboard?.recentTransactions || [];

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-2xl font-bold text-white">
        Welcome, {user?.displayName || user?.username}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card min-w-0">
          <div className="text-sm text-[#6b7280]">Balance</div>
          <div className="font-bold text-green-400 text-xl sm:text-2xl min-w-0 overflow-hidden">
            <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)' }}>
              ${formatCurrency(dashboard?.balance ?? 0, { compact: true })}
            </span>
          </div>
        </div>
        <div className="card min-w-0">
          <div className="text-sm text-[#6b7280]">Bonus</div>
          <div className="font-bold text-cyan-400 text-xl sm:text-2xl min-w-0 overflow-hidden">
            <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)' }}>
              ${formatCurrency(dashboard?.bonus ?? 0, { compact: true })}
            </span>
          </div>
        </div>
        <div className="card min-w-0">
          <div className="text-sm text-[#6b7280]">Locked</div>
          <div className="font-bold text-amber-400 text-xl sm:text-2xl min-w-0 overflow-hidden">
            <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)' }}>
              ${formatCurrency(dashboard?.locked ?? 0, { compact: true })}
            </span>
          </div>
        </div>
        <div className="card min-w-0">
          <div className="text-sm text-[#6b7280]">Exposure</div>
          <div className={`font-bold ${(dashboard?.exposure ?? 0) > 0 ? "text-red-400" : "text-gray-400"} text-xl sm:text-2xl min-w-0 overflow-hidden`}>
            <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)' }}>
              ${formatCurrency(dashboard?.exposure ?? 0, { compact: true })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Bets</h2>
          {recentBets.length === 0 ? (
            <p className="text-center text-[#6b7280] py-8">No recent bets</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-left text-[#6b7280]">
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4 text-right">Stake</th>
                    <th className="pb-2 pr-4 text-right">Odds</th>
                    <th className="pb-2 pr-4 text-right">Win</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBets.map((bet: any) => (
                    <tr key={bet.id} className="border-b border-slate-700/50">
                      <td className="py-2 pr-4 text-white">{bet.type}</td>
                      <td className="py-2 pr-4 text-right text-[#d1d5db]">${formatCurrency(bet.stake)}</td>
                      <td className="py-2 pr-4 text-right text-[#d1d5db]">{Number(bet.totalOdds).toFixed(2)}</td>
                      <td className="py-2 pr-4 text-right text-[#d1d5db]">${formatCurrency(bet.potentialWin)}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${betStatusColors[bet.status] || ""}`}>
                          {bet.status}
                        </span>
                      </td>
                      <td className="py-2 text-[#6b7280] text-xs">{formatDate(bet.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-center text-[#6b7280] py-8">No recent transactions</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-left text-[#6b7280]">
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4 text-right">Amount</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-slate-700/50">
                      <td className="py-2 pr-4 text-white">{tx.type}</td>
                      <td className={`py-2 pr-4 text-right font-mono ${tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN' ? '+' : '-'}${formatCurrency(tx.amount)}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          tx.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                          tx.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>{tx.status}</span>
                      </td>
                      <td className="py-2 text-[#6b7280] text-xs">{formatDate(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

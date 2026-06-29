"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { leaderboardApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"all" | "weekly">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () =>
      period === "all"
        ? leaderboardApi.getAllTime(100).then((r) => r.data)
        : leaderboardApi.getWeekly(100).then((r) => r.data),
  });

  const entries = data?.data || data || [];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Leaderboard</h1>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setPeriod("all")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            period === "all"
              ? "bg-cyan-600 text-[#ffffff]"
              : "bg-[#2a2a2a] text-[#9ca3af] hover:text-white"
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setPeriod("weekly")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            period === "weekly"
              ? "bg-cyan-600 text-[#ffffff]"
              : "bg-[#2a2a2a] text-[#9ca3af] hover:text-white"
          }`}
        >
          This Week
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="animate-pulse text-[#6b7280]">Loading leaderboard...</div>
        ) : entries.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-left text-[#6b7280]">
                <th className="pb-3 pr-4 w-12">#</th>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4 text-right">Bets</th>
                <th className="pb-3 pr-4 text-right">Wins</th>
                <th className="pb-3 text-right">Winnings</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: any, index: number) => (
                <tr
                  key={entry.userId || index}
                  className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                >
                  <td className="py-3 pr-4">
                    {entry.rank <= 3 ? (
                      <span className="text-lg">
                        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                      </span>
                    ) : (
                      <span className="text-[#6b7280]">{entry.rank}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-medium text-white">{entry.username}</td>
                  <td className="py-3 pr-4 text-right text-[#6b7280]">{entry.totalBets}</td>
                  <td className="py-3 pr-4 text-right text-green-400">{entry.totalWins}</td>
                  <td className="py-3 text-right font-medium text-green-400">${formatCurrency(entry.totalWinnings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-[#6b7280]">No data available yet</div>
        )}
      </div>
    </div>
  );
}

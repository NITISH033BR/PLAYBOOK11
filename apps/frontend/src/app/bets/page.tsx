"use client";

import { useState } from "react";
import { useBets, useActiveBets } from "../../hooks/useBets";
import { formatCurrency, formatDate, getStatusColor } from "../../lib/utils";

export default function BetsPage() {
  const [tab, setTab] = useState<"active" | "history">("active");
  const [page, setPage] = useState(1);

  const { data: activeData } = useActiveBets();
  const { data: historyData } = useBets({ page, limit: 20 });

  const activeBets = activeData?.data || activeData || [];
  const history = historyData?.data?.data || historyData?.data || [];
  const meta = historyData?.data?.meta || historyData?.meta;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-white">My Bets</h1>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("active")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "active"
              ? "bg-cyan-600 text-[#ffffff]"
              : "bg-[#2a2a2a] text-[#9ca3af] hover:text-white"
          }`}
        >
          Active ({activeBets.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "history"
              ? "bg-cyan-600 text-[#ffffff]"
              : "bg-[#2a2a2a] text-[#9ca3af] hover:text-white"
          }`}
        >
          History
        </button>
      </div>

      {tab === "active" && (
        <div className="space-y-3">
          {activeBets.length > 0 ? (
            activeBets.map((bet: any) => (
              <div key={bet.id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">{bet.type}</span>
                    <span className="mx-2 text-[#6b7280]">|</span>
                    <span className="text-[#d1d5db]">${formatCurrency(bet.stake)}</span>
                    <span className="mx-2 text-[#6b7280]">@</span>
                    <span className="text-green-400">{Number(bet.totalOdds).toFixed(2)}</span>
                  </div>
                  <span className="text-sm text-amber-400">PENDING</span>
                </div>
                <div className="mt-2 text-sm text-[#6b7280]">
                  Potential Win: ${formatCurrency(bet.potentialWin)}
                </div>
                {bet.legs?.map((leg: any) => (
                  <div key={leg.id} className="mt-2 rounded-md bg-[#2a2a2a] p-2 text-sm text-[#d1d5db]">
                    <span>{leg.market?.name}: </span>
                    <span className="font-medium text-white">{leg.odds?.label}</span>
                    <span className="ml-2 text-green-400">@{Number(leg.oddsValue).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="card text-center text-[#6b7280]">No active bets</div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {history.length > 0 ? (
            history.map((bet: any) => (
              <div key={bet.id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">{bet.type}</span>
                    <span className="mx-2 text-[#6b7280]">|</span>
                    <span className="text-[#d1d5db]">${formatCurrency(bet.stake)}</span>
                    <span className="mx-2 text-[#6b7280]">@</span>
                    <span className="text-green-400">{Number(bet.totalOdds).toFixed(2)}</span>
                  </div>
                  <span className={`text-sm ${getStatusColor(bet.status)}`}>{bet.status}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-[#6b7280]">
                  <span>Win: ${formatCurrency(bet.potentialWin)}</span>
                  <span>{formatDate(bet.createdAt)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center text-[#6b7280]">No bet history</div>
          )}

          {meta?.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: meta.totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`rounded px-3 py-1 text-sm ${
                    page === i + 1
                      ? "bg-cyan-600 text-[#ffffff]"
                      : "bg-[#2a2a2a] text-[#6b7280] hover:text-white"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

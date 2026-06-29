"use client";

import { useQuery } from "@tanstack/react-query";
import { referralsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDate, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ReferralsPage() {
  const { user } = useAuthStore();

  const { data: statsData } = useQuery({
    queryKey: ["referrals", "stats"],
    queryFn: () => referralsApi.getStats().then((r) => r.data),
    enabled: !!user,
  });

  const { data: historyData } = useQuery({
    queryKey: ["referrals", "history"],
    queryFn: () => referralsApi.getHistory().then((r) => r.data),
    enabled: !!user,
  });

  const stats = statsData?.data || statsData;
  const history = historyData?.data || historyData || [];

  const copyCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      toast.success("Referral code copied!");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Referrals</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Your Referral Code</h2>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-md bg-[#2a2a2a] px-4 py-3 font-mono text-lg text-cyan-400 text-center">
              {user?.referralCode}
            </code>
            <button
              onClick={copyCode}
              className="rounded-md bg-cyan-600 px-4 py-3 text-sm font-medium text-[#ffffff] hover:brightness-110 transition-all"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Referral Stats</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Total Referrals</span>
              <span className="font-medium text-white">{stats?.totalReferrals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Commission Earned</span>
              <span className="font-medium text-green-400">${formatCurrency(stats?.totalCommission || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-white">Referral History</h2>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((ref: any) => (
              <div key={ref.id} className="flex items-center justify-between rounded-md bg-[#2a2a2a] p-3">
                <div>
                  <p className="font-medium text-white">{ref.referred?.displayName || ref.referred?.username}</p>
                  <p className="text-xs text-[#6b7280]">Joined {formatDate(ref.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-400">${formatCurrency(ref.commissionEarned)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[#6b7280]">No referrals yet. Share your code to earn bonuses!</p>
        )}
      </div>
    </div>
  );
}

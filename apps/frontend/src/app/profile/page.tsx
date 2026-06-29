"use client";

import { useProfile } from "@/hooks/useAuth";
import { useBets } from "@/hooks/useBets";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { useLogout } from "@/hooks/useAuth";
import Link from "next/link";

export default function ProfilePage() {
  const { data: profileData, isLoading } = useProfile();
  const { data: walletData } = useWallet();
  const { data: betsData } = useBets({ limit: 10 });
  const logout = useLogout();

  const profile = profileData?.data || profileData;
  const wallet = walletData?.data || walletData;
  const bets = betsData?.data?.data || betsData?.data || betsData || [];

  if (isLoading) {
    return <div className="mx-auto max-w-4xl"><div className="card animate-pulse p-8 text-center text-[#6b7280]">Loading profile...</div></div>;
  }

  if (!profile) {
    return <div className="mx-auto max-w-4xl"><div className="card text-center text-[#6b7280] py-8">Please login to view your profile</div></div>;
  }

  const totalStaked = bets.reduce((s: number, b: any) => s + Number(b.stake), 0);
  const totalWon = bets.filter((b: any) => b.status === "WON").reduce((s: number, b: any) => s + Number(b.potentialWin), 0);
  const pnl = totalWon - totalStaked;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <button onClick={() => logout.mutate()} className="rounded-md bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors">Logout</button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="card text-center">
          <div className="text-xs text-[#6b7280] uppercase tracking-wide">Total Bets</div>
          <div className="mt-1 text-2xl font-bold text-white">{profile._count?.bets || bets.length}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-[#6b7280] uppercase tracking-wide">Total Staked</div>
          <div className="mt-1 text-2xl font-bold text-white">${formatCurrency(totalStaked)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-[#6b7280] uppercase tracking-wide">Total Won</div>
          <div className="mt-1 text-2xl font-bold text-green-400">${formatCurrency(totalWon)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-[#6b7280] uppercase tracking-wide">P&L</div>
          <div className={`mt-1 text-2xl font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            {pnl >= 0 ? "+" : ""}${formatCurrency(pnl)}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <span>👤</span> Account Details
          </h2>
          <div className="space-y-3 text-sm">
            <InfoRow label="Username" value={profile.username} />
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Display Name" value={profile.displayName} />
            <InfoRow label="Role" value={profile.role} />
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Referral Code</span>
              <span className="font-mono text-cyan-400 font-medium">{profile.referralCode}</span>
            </div>
            <InfoRow label="Referrals" value={String(profile._count?.referrals || 0)} />
            <InfoRow label="Joined" value={formatDate(profile.createdAt)} />
          </div>
          <div className="mt-4">
            <Link href="/referrals" className="text-sm text-cyan-400 hover:text-cyan-300">View Referrals →</Link>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <span>💰</span> Wallet Summary
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[#6b7280]">Balance</span>
              <span className="text-2xl font-bold text-white">${formatCurrency(wallet?.balance || 0)}</span>
            </div>
            <div className="border-t border-slate-700/50 pt-3">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Bonus</span>
                <span className="font-medium text-green-400">${formatCurrency(wallet?.bonus || 0)}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[#6b7280]">Locked in Bets</span>
                <span className="font-medium text-amber-400">${formatCurrency(wallet?.locked || 0)}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[#6b7280]">Available</span>
                <span className="font-medium text-white">${formatCurrency(Math.max(0, Number(wallet?.balance || 0) - Number(wallet?.locked || 0)))}</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/wallet" className="text-sm text-cyan-400 hover:text-cyan-300">Manage Wallet →</Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <span>🎲</span> Recent Bets
          </h2>
          <Link href="/bets" className="text-sm text-cyan-400 hover:text-cyan-300">View All →</Link>
        </div>
        {bets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-left text-[#6b7280]">
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4 text-right">Stake</th>
                  <th className="pb-2 pr-4 text-right">Odds</th>
                  <th className="pb-2 pr-4 text-right">Potential Win</th>
                  <th className="pb-2 pr-4 text-center">Status</th>
                  <th className="pb-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet: any) => {
                  const won = bet.status === "WON";
                  return (
                    <tr key={bet.id} className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 pr-4 text-[#d1d5db]">{bet.type}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-[#d1d5db]">${formatCurrency(bet.stake)}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-[#d1d5db]">{Number(bet.totalOdds).toFixed(2)}</td>
                      <td className={`py-3 pr-4 text-right tabular-nums font-medium ${won ? "text-green-400" : "text-[#6b7280]"}`}>
                        {won ? "+" : ""}${formatCurrency(won ? bet.potentialWin : 0)}
                      </td>
                      <td className={`py-3 pr-4 text-center`}>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(bet.status)}`}>
                          {bet.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[#6b7280] text-xs">{formatDate(bet.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-[#6b7280]">
            <div className="text-4xl mb-2">🎲</div>
            <p>No bets yet</p>
            <Link href="/matches" className="mt-2 inline-block text-sm text-cyan-400 hover:text-cyan-300">Browse Matches →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#6b7280]">{label}</span>
      <span className="font-medium text-[#d1d5db]">{value}</span>
    </div>
  );
}

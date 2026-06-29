'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

type ReportType = 'deposits' | 'withdrawals' | 'transactions' | 'bets' | 'commissions' | 'revenue' | 'hierarchy';

const reportLabels: Record<ReportType, string> = {
  deposits: 'Deposits',
  withdrawals: 'Withdrawals',
  transactions: 'Transactions',
  bets: 'Bets',
  commissions: 'Commissions',
  revenue: 'Revenue',
  hierarchy: 'Hierarchy',
};

export default function AdminReports() {
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const queryConfig = {
    deposits: { queryKey: ['admin', 'reports', 'deposits', page], fn: () => adminApi.getDepositReport({ page, limit: 50, startDate, endDate }).then((r) => r.data) },
    withdrawals: { queryKey: ['admin', 'reports', 'withdrawals', page], fn: () => adminApi.getWithdrawalReport({ page, limit: 50, startDate, endDate }).then((r) => r.data) },
    transactions: { queryKey: ['admin', 'reports', 'transactions', page], fn: () => adminApi.getTransactionReport({ page, limit: 50, startDate, endDate }).then((r) => r.data) },
    bets: { queryKey: ['admin', 'reports', 'bets', page], fn: () => adminApi.getBetReport({ page, limit: 50, startDate, endDate }).then((r) => r.data) },
    commissions: { queryKey: ['admin', 'reports', 'commissions', page], fn: () => adminApi.getCommissionReport({ page, limit: 50, startDate, endDate }).then((r) => r.data) },
    revenue: { queryKey: ['admin', 'reports', 'revenue'], fn: () => adminApi.getRevenueReport({ startDate, endDate }).then((r) => r.data) },
    hierarchy: { queryKey: ['admin', 'reports', 'hierarchy'], fn: () => adminApi.getHierarchyReport({}).then((r) => r.data) },
  };

  const { data, isLoading } = useQuery<any>(queryConfig[reportType]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-gray-400 text-sm mt-1">Platform analytics and reporting</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.keys(reportLabels) as ReportType[]).map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              reportType === type ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {reportLabels[type]}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm" />
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg h-12" />
          ))}
        </div>
      ) : reportType === 'revenue' && data?.data ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Stakes', value: data.data.totalStakes, color: 'text-blue-400', isCurrency: true },
            { label: 'Total Payouts', value: data.data.totalPayouts, color: 'text-red-400', isCurrency: true },
            { label: 'Total Deposits', value: data.data.totalDeposits, color: 'text-green-400', isCurrency: true },
            { label: 'Total Withdrawals', value: data.data.totalWithdrawals, color: 'text-orange-400', isCurrency: true },
            { label: 'Revenue', value: data.data.revenue, color: data.data.revenue >= 0 ? 'text-green-400' : 'text-red-400', isCurrency: true },
            { label: 'Margin', value: data.data.margin, color: 'text-cyan-400', isCurrency: false },
          ].map((item) => (
            <div key={item.label} className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 min-w-0">
              <div className="text-xs text-gray-400 uppercase mb-1 truncate">{item.label}</div>
              <div className={`font-bold font-mono ${item.color} text-xl min-w-0 overflow-hidden`}>
                <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>
                  {item.isCurrency ? '$' : ''}
                  {typeof item.value === 'number'
                    ? item.isCurrency
                      ? formatCurrency(item.value, { compact: true })
                      : item.value.toLocaleString()
                    : item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : reportType === 'hierarchy' && data?.data ? (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Masters', value: data.data.summary?.masters || 0, color: 'text-amber-400' },
              { label: 'Agents', value: data.data.summary?.agents || 0, color: 'text-cyan-400' },
              { label: 'Players', value: data.data.summary?.players || 0, color: 'text-green-400' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 min-w-0">
                <div className="text-xs text-gray-400 uppercase mb-1 truncate">{item.label}</div>
                <div className={`font-bold font-mono ${item.color} text-xl min-w-0 overflow-hidden`}>
                  <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>
                    {item.value.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 px-3">Username</th>
                  <th className="text-left py-2 px-3 hidden md:table-cell">Email</th>
                  <th className="text-right py-2 px-3">Agents</th>
                  <th className="text-right py-2 px-3">Commission</th>
                  <th className="text-right py-2 px-3">Wallet</th>
                </tr>
              </thead>
              <tbody>
                {(data.data.topMasters || []).map((m: any) => (
                  <tr key={m.id} className="border-b border-gray-700/30">
                    <td className="py-2 px-3 text-white">{m.username}</td>
                    <td className="py-2 px-3 text-gray-300 hidden md:table-cell">{m.email}</td>
                    <td className="py-2 px-3 text-right">{m.hierarchy?._count?.children || 0}</td>
                    <td className="py-2 px-3 text-right">{m.hierarchy?.commissionRate || 0}%</td>
                    <td className="py-2 px-3 text-right font-mono">${Number(m.wallet?.balance || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-3">ID</th>
                <th className="text-left py-2 px-3 hidden md:table-cell">User</th>
                <th className="text-left py-2 px-3">Amount</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3 hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map((item: any) => (
                <tr key={item.id} className="border-b border-gray-700/30">
                  <td className="py-2 px-3 text-gray-400 font-mono text-xs">{item.id.slice(0, 8)}</td>
                  <td className="py-2 px-3 text-gray-300 hidden md:table-cell">{item.user?.username || item.userId?.slice(0, 8)}</td>
                  <td className="py-2 px-3 font-mono">${Number(item.amount || 0).toLocaleString()}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      item.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                      item.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>{item.status}</span>
                  </td>
                  <td className="py-2 px-3 text-gray-400 text-xs hidden lg:table-cell">{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.meta?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1.5 bg-gray-700 rounded text-sm disabled:opacity-50 hover:bg-gray-600 transition-colors">Prev</button>
          <span className="text-sm text-gray-400">Page {data.meta.page} of {data.meta.totalPages}</span>
          <button onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))} disabled={page >= data.meta.totalPages} className="px-3 py-1.5 bg-gray-700 rounded text-sm disabled:opacity-50 hover:bg-gray-600 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}

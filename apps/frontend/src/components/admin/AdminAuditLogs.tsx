'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useState } from 'react';
import { motion } from 'framer-motion';

const actionColors: Record<string, string> = {
  LOGIN: 'bg-green-500/10 text-green-400',
  LOGOUT: 'bg-gray-500/10 text-gray-400',
  CREATE: 'bg-blue-500/10 text-blue-400',
  SUSPEND_USER: 'bg-red-500/10 text-red-400',
  REACTIVATE_USER: 'bg-emerald-500/10 text-emerald-400',
  DELETE_USER: 'bg-red-500/10 text-red-400',
  DEPOSIT: 'bg-emerald-500/10 text-emerald-400',
  WITHDRAWAL: 'bg-orange-500/10 text-orange-400',
  TRANSFER: 'bg-blue-500/10 text-blue-400',
  RESET_PASSWORD: 'bg-purple-500/10 text-purple-400',
  COMMISSION_CHANGE: 'bg-amber-500/10 text-amber-400',
  CREATE_MATCH: 'bg-cyan-500/10 text-cyan-400',
  UPDATE_MATCH: 'bg-cyan-500/10 text-cyan-400',
  ADD_MARKET: 'bg-indigo-500/10 text-indigo-400',
  UPDATE_ODDS: 'bg-indigo-500/10 text-indigo-400',
};

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', page, actionFilter],
    queryFn: () => adminApi.getAuditLogs({ page, limit: 50 }).then((r) => r.data),
    refetchInterval: 10000,
  });

  const logs = data?.data || [];
  const meta = data?.meta;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400 text-sm mt-1">Track all admin actions</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter by action..."
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm w-48"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg h-12" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📋</div>
          <p>No audit logs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any, i: number) => {
            const action = log.action;
            const actionClass = actionColors[action] || 'bg-gray-500/10 text-gray-400';
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-start gap-3 bg-gray-800/40 rounded-lg p-3 border border-gray-700/30"
              >
                <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${actionClass}`}>
                  {action}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-300 font-medium">
                      {log.user?.username || 'System'}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="text-gray-400">{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}</span>
                  </div>
                  {log.metadata && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {typeof log.metadata === 'object' ? JSON.stringify(log.metadata).slice(0, 100) : String(log.metadata).slice(0, 100)}
                    </div>
                  )}
                  {log.reason && (
                    <div className="text-xs text-gray-500 mt-0.5">Reason: {log.reason}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1.5 bg-gray-700 rounded text-sm disabled:opacity-50 hover:bg-gray-600 transition-colors">Prev</button>
          <span className="text-sm text-gray-400">Page {meta.page} of {meta.totalPages}</span>
          <button onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page >= meta.totalPages} className="px-3 py-1.5 bg-gray-700 rounded text-sm disabled:opacity-50 hover:bg-gray-600 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}

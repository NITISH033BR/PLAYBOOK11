'use client';

import { useQuery } from '@tanstack/react-query';
import { hierarchyApi } from '@/lib/api';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'text-purple-400', ADMIN: 'text-blue-400',
  MASTER_ID: 'text-amber-400', AGENT: 'text-cyan-400', USER: 'text-gray-300',
};

const levelColors: Record<string, string> = {
  LEVEL_1_ADMIN: 'border-blue-500/30 bg-blue-500/5',
  LEVEL_2_MASTER: 'border-amber-500/30 bg-amber-500/5',
  LEVEL_3_AGENT: 'border-cyan-500/30 bg-cyan-500/5',
  LEVEL_4_PLAYER: 'border-gray-500/30 bg-gray-500/5',
};

function TreeNode({ node, depth = 0, searchQuery }: { node: any; depth?: number; searchQuery?: string }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const children = node.children || [];
  const hasChildren = children.length > 0;

  const displayName = node.user?.username || node.username || node.displayName || '';
  const displayRole = node.user?.role || node.role || '';
  const displayLevel = node.level || '';
  const displayStatus = node.user?.status || node.status || '';
  const displayCommission = node.commissionRate ?? node.user?.hierarchy?.commissionRate;

  const matchesSearch = searchQuery
    ? displayName.toLowerCase().includes(searchQuery.toLowerCase())
    : true;

  const childMatches = searchQuery
    ? children.some((c: any) => {
        const name = c.user?.username || c.username || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : false;

  const showNode = matchesSearch || childMatches;
  if (!showNode && searchQuery) return null;

  const autoExpand = searchQuery && childMatches;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors group ${levelColors[displayLevel] || 'border-transparent'} border ${matchesSearch && searchQuery ? 'bg-cyan-500/10 border-cyan-500/30' : 'hover:bg-gray-700/30'}`}
        style={{ marginLeft: `${depth * 24}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-5 h-5 flex items-center justify-center text-xs transition-colors ${hasChildren ? 'text-gray-400 hover:text-white cursor-pointer' : 'text-gray-600 cursor-default'}`}
        >
          {hasChildren ? (expanded || autoExpand ? '▼' : '▶') : '●'}
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className={`text-sm font-medium truncate ${roleColors[displayRole] || 'text-gray-300'}`}>
            {displayName}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {displayRole || displayLevel?.replace('LEVEL_', '').replace('_', ' ')}
          </span>
          {displayStatus === 'SUSPENDED' && (
            <span className="text-xs text-red-400 flex-shrink-0">Suspended</span>
          )}
        </div>
        {displayCommission != null && Number(displayCommission) > 0 && (
          <span className="text-xs text-gray-500 flex-shrink-0">{displayCommission}%</span>
        )}
      </div>
      <AnimatePresence>
        {(expanded || autoExpand) && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {children.map((child: any) => (
              <TreeNode key={child.id || child.userId} node={child} depth={depth + 1} searchQuery={searchQuery} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminHierarchy() {
  const router = useRouter();
  const [masterId, setMasterId] = useState('');
  const [search, setSearch] = useState('');

  const { data: mastersData } = useQuery({
    queryKey: ['masters-list'],
    queryFn: () => hierarchyApi.getMasters({ page: 1, limit: 100 }).then((r) => r.data),
  });

  const { data: treeData, isLoading } = useQuery({
    queryKey: ['hierarchy-tree', masterId],
    queryFn: () => masterId ? hierarchyApi.getUserTree(masterId) : hierarchyApi.getTree(),
    enabled: true,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['hierarchy-analytics'],
    queryFn: () => hierarchyApi.getAnalytics().then((r) => r.data),
  });

  const tree = treeData?.data || treeData;
  const masters = mastersData?.data?.data || mastersData?.data || [];
  const analytics = analyticsData?.data || analyticsData;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Hierarchy Tree</h1>
          <p className="text-gray-400 text-sm mt-1">Visualize and manage the user hierarchy</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username..."
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm w-48"
          />
          <select
            value={masterId}
            onChange={(e) => setMasterId(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm"
          >
            <option value="">My Tree</option>
            {(Array.isArray(masters) ? masters : []).map((m: any) => (
              <option key={m.id} value={m.id}>{m.username}</option>
            ))}
          </select>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-gray-800/40 rounded-lg border border-gray-700/50 p-3">
            <div className="text-xs text-gray-500">Masters</div>
            <div className="text-lg font-bold text-amber-400">{analytics.mastersCount ?? 0}</div>
          </div>
          <div className="bg-gray-800/40 rounded-lg border border-gray-700/50 p-3">
            <div className="text-xs text-gray-500">Agents</div>
            <div className="text-lg font-bold text-cyan-400">{analytics.agentsCount ?? 0}</div>
          </div>
          <div className="bg-gray-800/40 rounded-lg border border-gray-700/50 p-3">
            <div className="text-xs text-gray-500">Players</div>
            <div className="text-lg font-bold text-green-400">{analytics.playersCount ?? 0}</div>
          </div>
          <div className="bg-gray-800/40 rounded-lg border border-gray-700/50 p-3">
            <div className="text-xs text-gray-500">Active</div>
            <div className="text-lg font-bold text-green-400">{analytics.activeUsers ?? 0}</div>
          </div>
          <div className="bg-gray-800/40 rounded-lg border border-gray-700/50 p-3">
            <div className="text-xs text-gray-500">Suspended</div>
            <div className="text-lg font-bold text-red-400">{analytics.suspendedUsers ?? 0}</div>
          </div>
          <div className="bg-gray-800/40 rounded-lg border border-gray-700/50 p-3">
            <div className="text-xs text-gray-500">Exposure</div>
            <div className="text-lg font-bold text-amber-400">${Number(analytics.totalExposure || 0).toLocaleString()}</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded h-8" style={{ marginLeft: `${(i % 4) * 20}px` }} />
          ))}
        </div>
      ) : tree ? (
        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-4">
          <TreeNode node={tree} searchQuery={search} />
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">🌳</div>
          <p className="text-lg mb-2">No hierarchy data available</p>
          <p className="text-sm text-gray-600 mb-6">Create your first master to start building your hierarchy</p>
          <button
            onClick={() => router.push('/admin?tab=masters')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Create Master
          </button>
        </div>
      )}
    </div>
  );
}

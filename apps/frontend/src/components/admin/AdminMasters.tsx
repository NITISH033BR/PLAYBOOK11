'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hierarchyApi } from '@/lib/api';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

type ModalType = 'create' | 'edit' | 'suspend' | 'reactivate' | 'delete' | 'deposit' | 'withdraw' | 'resetPassword' | 'detail' | null;

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
  DELETED: 'bg-gray-500/20 text-gray-400',
};

function MasterModal({ type, master, onClose, onConfirm }: { type: ModalType; master: any; onClose: () => void; onConfirm: (data?: any) => void }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [exposureLimit, setExposureLimit] = useState('');
  const [maxPlayerCount, setMaxPlayerCount] = useState('');
  const [amount, setAmount] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const modalTitle: Record<string, string> = {
    create: 'Create Master',
    edit: 'Edit Master',
    suspend: 'Suspend Master',
    reactivate: 'Reactivate Master',
    delete: 'Delete Master',
    deposit: 'Deposit to Wallet',
    withdraw: 'Withdraw from Wallet',
    resetPassword: 'Reset Password',
    detail: 'Master Details',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-4">{modalTitle[type || '']}</h2>

        {type === 'create' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Username *</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Password *</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Commission Rate (%)</label>
              <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" min="0" max="100" step="0.1" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Credit Limit</label>
              <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" min="0" step="0.01" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Exposure Limit</label>
              <input type="number" value={exposureLimit} onChange={(e) => setExposureLimit(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" min="0" step="0.01" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Max Players</label>
              <input type="number" value={maxPlayerCount} onChange={(e) => setMaxPlayerCount(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" min="1" />
            </div>
          </div>
        )}

        {type === 'edit' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400">Commission Rate (%)</label>
              <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" min="0" max="100" step="0.1" placeholder={String(master?.hierarchy?.commissionRate ?? 0)} />
            </div>
            <div>
              <label className="text-sm text-gray-400">Credit Limit</label>
              <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" min="0" step="0.01" placeholder={String(master?.hierarchy?.creditLimit ?? '')} />
            </div>
            <div>
              <label className="text-sm text-gray-400">Exposure Limit</label>
              <input type="number" value={exposureLimit} onChange={(e) => setExposureLimit(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" min="0" step="0.01" placeholder={String(master?.hierarchy?.exposureLimit ?? '')} />
            </div>
            <div>
              <label className="text-sm text-gray-400">Max Players</label>
              <input type="number" value={maxPlayerCount} onChange={(e) => setMaxPlayerCount(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1" min="1" placeholder={String(master?.hierarchy?.maxPlayerCount ?? '')} />
            </div>
          </div>
        )}

        {type === 'deposit' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Deposit to <span className="text-white">{master?.username}</span></p>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" min="0.01" step="0.01" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
        )}

        {type === 'withdraw' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Withdraw from <span className="text-white">{master?.username}</span></p>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" min="0.01" step="0.01" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
        )}

        {type === 'resetPassword' && (
          <div className="space-y-3">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" minLength={8} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
        )}

        {type === 'suspend' && (
          <p className="text-sm text-gray-400">Suspend <span className="text-white">{master?.username}</span>? They will lose all access.</p>
        )}

        {type === 'reactivate' && (
          <p className="text-sm text-gray-400">Reactivate <span className="text-white">{master?.username}</span>? They will regain full access.</p>
        )}

        {type === 'delete' && (
          <p className="text-sm text-gray-400">Delete <span className="text-white">{master?.username}</span>? This action cannot be undone.</p>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
          <button
            onClick={() => {
              if (type === 'create') {
                const payload: any = { email, username, password };
                if (displayName) payload.displayName = displayName;
                if (commissionRate) payload.commissionRate = parseFloat(commissionRate);
                if (creditLimit) payload.creditLimit = parseFloat(creditLimit);
                if (exposureLimit) payload.exposureLimit = parseFloat(exposureLimit);
                if (maxPlayerCount) payload.maxPlayerCount = parseInt(maxPlayerCount);
                onConfirm(payload);
              } else if (type === 'edit') {
                const payload: any = {};
                if (commissionRate) payload.commissionRate = parseFloat(commissionRate);
                if (creditLimit) payload.creditLimit = parseFloat(creditLimit);
                if (exposureLimit) payload.exposureLimit = parseFloat(exposureLimit);
                if (maxPlayerCount) payload.maxPlayerCount = parseInt(maxPlayerCount);
                onConfirm(payload);
              } else if (type === 'deposit') {
                onConfirm({ amount: parseFloat(amount) });
              } else if (type === 'withdraw') {
                onConfirm({ amount: parseFloat(amount) });
              } else if (type === 'resetPassword') {
                onConfirm({ newPassword });
              } else {
                onConfirm();
              }
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              type === 'delete' || type === 'suspend' ? 'bg-red-600 hover:bg-red-700 text-white' :
              type === 'reactivate' ? 'bg-green-600 hover:bg-green-700 text-white' :
              'bg-cyan-600 hover:bg-cyan-700 text-white'
            }`}
          >
            {type === 'create' ? 'Create' :
             type === 'edit' ? 'Save' :
             type === 'deposit' ? 'Deposit' :
             type === 'withdraw' ? 'Withdraw' :
             type === 'resetPassword' ? 'Reset' :
             type === 'suspend' ? 'Suspend' :
             type === 'reactivate' ? 'Reactivate' :
             type === 'delete' ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminMasters() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ type: ModalType; master: any } | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'masters', search, page],
    queryFn: () => hierarchyApi.getMasters({ page, limit: 20, search }).then((r) => r.data),
  });

  const masters = data?.data?.data || data?.data || [];
  const meta = data?.meta || data?.data?.meta;

  const createMutation = useMutation({
    mutationFn: (d: any) => hierarchyApi.createMaster(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'masters'] }); toast.success('Master created'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create master'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: any }) => hierarchyApi.updateUser(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'masters'] }); toast.success('Master updated'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update master'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => hierarchyApi.updateStatus(id, { isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'masters'] }); toast.success('Status updated'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hierarchyApi.deleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'masters'] }); toast.success('Master deleted'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete master'),
  });

  const depositMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: any }) => hierarchyApi.deposit(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'masters'] }); toast.success('Deposit successful'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Deposit failed'),
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: any }) => hierarchyApi.withdraw(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'masters'] }); toast.success('Withdrawal successful'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Withdrawal failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: any }) => hierarchyApi.resetPassword(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'masters'] }); toast.success('Password reset'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Password reset failed'),
  });

  const handleModalConfirm = (formData?: any) => {
    if (!modal) return;
    const { type, master } = modal;

    switch (type) {
      case 'create': createMutation.mutate(formData); break;
      case 'edit': updateMutation.mutate({ id: master.id, data: formData }); break;
      case 'suspend': statusMutation.mutate({ id: master.id, isActive: false }); break;
      case 'reactivate': statusMutation.mutate({ id: master.id, isActive: true }); break;
      case 'delete': deleteMutation.mutate(master.id); break;
      case 'deposit': depositMutation.mutate({ id: master.id, data: formData }); break;
      case 'withdraw': withdrawMutation.mutate({ id: master.id, data: formData }); break;
      case 'resetPassword': passwordMutation.mutate({ id: master.id, data: formData }); break;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Masters Management</h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage all masters</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search masters..."
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm w-64"
          />
          <button
            onClick={() => setModal({ type: 'create', master: null })}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            + Create Master
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg h-16" />
          ))}
        </div>
      ) : masters.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">👑</div>
          <p className="mb-4">No masters found</p>
          <button
            onClick={() => setModal({ type: 'create', master: null })}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create First Master
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-3 px-3 font-medium">Username</th>
                <th className="text-left py-3 px-3 font-medium hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-3 font-medium">Status</th>
                <th className="text-right py-3 px-3 font-medium hidden lg:table-cell">Commission</th>
                <th className="text-right py-3 px-3 font-medium hidden lg:table-cell">Agents</th>
                <th className="text-right py-3 px-3 font-medium hidden xl:table-cell">Credit Limit</th>
                <th className="text-right py-3 px-3 font-medium hidden xl:table-cell">Exposure</th>
                <th className="text-left py-3 px-3 font-medium hidden xl:table-cell">Created</th>
                <th className="text-right py-3 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {masters.map((m: any, i: number) => (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors relative"
                >
                  <td className="py-3 px-3">
                    <span className="text-white font-medium">{m.username}</span>
                    <span className="text-gray-500 text-xs ml-2">{m.displayName}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-300 hidden md:table-cell">{m.email}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[m.status] || ''}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-gray-300 hidden lg:table-cell">
                    {m.hierarchy?.commissionRate ?? 0}%
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300 hidden lg:table-cell">
                    {m.hierarchy?._count?.children ?? 0}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300 hidden xl:table-cell">
                    ${Number(m.hierarchy?.creditLimit || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300 hidden xl:table-cell">
                    ${Number(m.hierarchy?.exposureLimit || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-gray-400 text-xs hidden xl:table-cell">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setShowActions(showActions === m.id ? null : m.id)}
                        className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                      >
                        Actions ▾
                      </button>
                      {showActions === m.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1" onMouseLeave={() => setShowActions(null)}>
                          <button onClick={() => { setShowActions(null); setModal({ type: 'edit', master: m }); }} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">Edit</button>
                          {m.status === 'ACTIVE' && (
                            <button onClick={() => { setShowActions(null); setModal({ type: 'suspend', master: m }); }} className="w-full text-left px-3 py-1.5 text-xs text-amber-400 hover:bg-gray-700">Suspend</button>
                          )}
                          {m.status === 'SUSPENDED' && (
                            <button onClick={() => { setShowActions(null); setModal({ type: 'reactivate', master: m }); }} className="w-full text-left px-3 py-1.5 text-xs text-green-400 hover:bg-gray-700">Reactivate</button>
                          )}
                          {m.status !== 'DELETED' && (
                            <>
                              <button onClick={() => { setShowActions(null); setModal({ type: 'deposit', master: m }); }} className="w-full text-left px-3 py-1.5 text-xs text-emerald-400 hover:bg-gray-700">Deposit</button>
                              <button onClick={() => { setShowActions(null); setModal({ type: 'withdraw', master: m }); }} className="w-full text-left px-3 py-1.5 text-xs text-orange-400 hover:bg-gray-700">Withdraw</button>
                              <button onClick={() => { setShowActions(null); setModal({ type: 'resetPassword', master: m }); }} className="w-full text-left px-3 py-1.5 text-xs text-purple-400 hover:bg-gray-700">Reset Password</button>
                              <button onClick={() => { setShowActions(null); setModal({ type: 'delete', master: m }); }} className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700">Delete</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1.5 bg-gray-700 rounded text-sm disabled:opacity-50 hover:bg-gray-600 transition-colors">Prev</button>
          <span className="text-sm text-gray-400">Page {meta.page} of {meta.totalPages}</span>
          <button onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page >= meta.totalPages} className="px-3 py-1.5 bg-gray-700 rounded text-sm disabled:opacity-50 hover:bg-gray-600 transition-colors">Next</button>
        </div>
      )}

      <AnimatePresence>
        {modal && <MasterModal type={modal.type} master={modal.master} onClose={() => setModal(null)} onConfirm={handleModalConfirm} />}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

type TabType = 'all' | 'masters' | 'agents' | 'players';
type ModalType = 'suspend' | 'reactivate' | 'delete' | 'deposit' | 'withdraw' | 'transfer' | 'resetPassword' | null;

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
  DELETED: 'bg-gray-500/20 text-gray-400',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-500/20 text-purple-400',
  ADMIN: 'bg-blue-500/20 text-blue-400',
  MASTER_ID: 'bg-amber-500/20 text-amber-400',
  AGENT: 'bg-cyan-500/20 text-cyan-400',
  USER: 'bg-gray-500/20 text-gray-300',
};

function UserModal({ type, user, onClose, onConfirm }: { type: ModalType; user: any; onClose: () => void; onConfirm: (data?: any) => void }) {
  const [reason, setReason] = useState('FRAUD');
  const [reasonText, setReasonText] = useState('');
  const [amount, setAmount] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const modalTitle: Record<string, string> = {
    suspend: 'Suspend User',
    reactivate: 'Reactivate User',
    delete: 'Delete User',
    deposit: 'Deposit to Wallet',
    withdraw: 'Withdraw from Wallet',
    transfer: 'Transfer Funds',
    resetPassword: 'Reset Password',
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
        className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-4">{modalTitle[type || '']}</h2>
        <p className="text-sm text-gray-400 mb-4">
          User: <span className="text-white font-medium">{user?.username || user?.email}</span>
        </p>

        {type === 'suspend' && (
          <div className="space-y-3">
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="FRAUD">Fraud</option>
              <option value="BONUS_ABUSE">Bonus Abuse</option>
              <option value="SUSPICIOUS_BETTING">Suspicious Betting</option>
              <option value="MULTI_ACCOUNT">Multi Account</option>
              <option value="MANUAL">Manual</option>
              <option value="OTHER">Other</option>
            </select>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Detailed reason..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm h-20 resize-none"
            />
          </div>
        )}

        {type === 'deposit' && (
          <div className="space-y-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              min="0.01"
              step="0.01"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        )}

        {type === 'withdraw' && (
          <div className="space-y-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              min="0.01"
              step="0.01"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
            <p className="text-xs text-gray-500">Wallet balance: ${Number(user?.wallet?.balance || 0).toFixed(2)}</p>
          </div>
        )}

        {type === 'transfer' && (
          <div className="space-y-3">
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="Destination user email"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              min="0.01"
              step="0.01"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        )}

        {type === 'resetPassword' && (
          <div className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              minLength={6}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        )}

        {(type === 'reactivate' || type === 'delete') && (
          <p className="text-sm text-gray-400">
            {type === 'reactivate' ? 'Reactivate this user? They will regain full access.' : 'Soft delete this user? They can still be found in reports.'}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={() => {
              const data: any = {};
              if (type === 'suspend') data.reasonType = reason, data.reason = reasonText;
              if (type === 'deposit') data.amount = parseFloat(amount);
              if (type === 'withdraw') data.amount = parseFloat(amount);
              if (type === 'transfer') data.targetEmail = targetEmail, data.amount = parseFloat(amount);
              if (type === 'resetPassword') data.newPassword = newPassword;
              onConfirm(data);
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              type === 'delete' ? 'bg-red-600 hover:bg-red-700 text-white' :
              type === 'suspend' ? 'bg-red-600 hover:bg-red-700 text-white' :
              'bg-cyan-600 hover:bg-cyan-700 text-white'
            }`}
          >
            {type === 'suspend' ? 'Suspend' :
             type === 'reactivate' ? 'Reactivate' :
             type === 'delete' ? 'Delete' :
             type === 'deposit' ? 'Deposit' :
             type === 'withdraw' ? 'Withdraw' :
             type === 'transfer' ? 'Transfer' :
             type === 'resetPassword' ? 'Reset' : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ type: ModalType; user: any } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', tab, search, page],
    queryFn: () => adminApi.getUsers({
      page, limit: 20, search,
      role: tab === 'all' ? undefined : tab === 'masters' ? 'MASTER_ID' : tab === 'agents' ? 'AGENT' : 'USER',
    }).then((r) => r.data),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: any }) => adminApi.suspendUser(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('User suspended'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to suspend'),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => adminApi.reactivateUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('User reactivated'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to reactivate'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.softDeleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('User deleted'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const depositMutation = useMutation({
    mutationFn: (d: any) => adminApi.deposit({ userId: modal?.user?.id, ...d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Deposit successful'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Deposit failed'),
  });

  const withdrawMutation = useMutation({
    mutationFn: (d: any) => adminApi.withdraw({ userId: modal?.user?.id, ...d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Withdrawal successful'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Withdrawal failed'),
  });

  const transferMutation = useMutation({
    mutationFn: (d: any) => adminApi.transfer({ fromUserId: modal?.user?.id, ...d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Transfer successful'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Transfer failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: (d: any) => adminApi.resetPassword(modal?.user?.id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Password reset'); setModal(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Password reset failed'),
  });

  const users = data?.data || [];
  const meta = data?.meta;

  const handleModalConfirm = (formData?: any) => {
    if (!modal) return;
    const { type, user } = modal;

    switch (type) {
      case 'suspend': suspendMutation.mutate({ id: user.id, data: formData }); break;
      case 'reactivate': reactivateMutation.mutate(user.id); break;
      case 'delete': deleteMutation.mutate(user.id); break;
      case 'deposit': depositMutation.mutate(formData); break;
      case 'withdraw': withdrawMutation.mutate(formData); break;
      case 'transfer': {
        const targetUser = users.find((u: any) => u.email === formData.targetEmail);
        if (!targetUser) { toast.error('User not found with that email'); return; }
        formData.toUserId = targetUser.id;
        delete formData.targetEmail;
        transferMutation.mutate(formData);
        break;
      }
      case 'resetPassword': passwordMutation.mutate(formData); break;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 text-sm mt-1">Manage all platform users</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users..."
          className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm w-full sm:w-64"
        />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'masters', 'agents', 'players'] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg h-16" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📭</div>
          <p>No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-3 px-3 font-medium">Username</th>
                <th className="text-left py-3 px-3 font-medium hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-3 font-medium">Role</th>
                <th className="text-left py-3 px-3 font-medium">Status</th>
                <th className="text-right py-3 px-3 font-medium hidden lg:table-cell">Wallet</th>
                <th className="text-right py-3 px-3 font-medium hidden xl:table-cell">Exposure</th>
                <th className="text-left py-3 px-3 font-medium hidden lg:table-cell">Parent</th>
                <th className="text-left py-3 px-3 font-medium hidden xl:table-cell">Created</th>
                <th className="text-right py-3 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any, i: number) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.lastLoginAt ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <span className="text-white font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-300 hidden md:table-cell">{user.email}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[user.role] || ''}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[user.status] || ''}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-gray-300 hidden lg:table-cell">
                    ${Number(user.wallet?.balance || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300 hidden xl:table-cell">
                    ${Number(user.hierarchy?.exposureLimit || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-gray-300 hidden lg:table-cell">
                    {user.parent ? (
                      <span className="text-xs">
                        <span className={roleColors[user.parent.role] || ''}>{user.parent.role}</span>
                        <span className="text-gray-500 ml-1">{user.parent.username}</span>
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-gray-400 text-xs hidden xl:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {user.status === 'ACTIVE' && (
                        <button onClick={() => setModal({ type: 'suspend', user })} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors">Suspend</button>
                      )}
                      {user.status === 'SUSPENDED' && (
                        <button onClick={() => setModal({ type: 'reactivate', user })} className="px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors">Activate</button>
                      )}
                      {user.status !== 'DELETED' && (
                        <>
                          <button onClick={() => setModal({ type: 'deposit', user })} className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors">Deposit</button>
                          <button onClick={() => setModal({ type: 'withdraw', user })} className="px-2 py-1 text-xs bg-orange-500/10 text-orange-400 rounded hover:bg-orange-500/20 transition-colors">Withdraw</button>
                          <button onClick={() => setModal({ type: 'transfer', user })} className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors">Transfer</button>
                          <button onClick={() => setModal({ type: 'resetPassword', user })} className="px-2 py-1 text-xs bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition-colors">Reset Pwd</button>
                          <button onClick={() => setModal({ type: 'delete', user })} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors">Delete</button>
                        </>
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
        {modal && <UserModal type={modal.type} user={modal.user} onClose={() => setModal(null)} onConfirm={handleModalConfirm} />}
      </AnimatePresence>
    </div>
  );
}

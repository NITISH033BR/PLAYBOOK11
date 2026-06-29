"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hierarchyApi, walletApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AgentPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("dashboard");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || user?.role !== "AGENT") {
      router.push("/");
    }
  }, [hydrated, isAuthenticated, user, router]);

  const { data: dashboardData } = useQuery({
    queryKey: ["hierarchy", "agent-dashboard"],
    queryFn: () => hierarchyApi.getAgentDashboard().then((r) => r.data),
    enabled: isAuthenticated && user?.role === "AGENT" && tab === "dashboard",
  });

  const [playersPage, setPlayersPage] = useState(1);
  const [playersSearch, setPlayersSearch] = useState("");

  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ["hierarchy", "my-players", playersPage, playersSearch],
    queryFn: () => hierarchyApi.getMyPlayers({ page: playersPage, limit: 20, search: playersSearch || undefined }).then((r) => r.data),
    enabled: isAuthenticated && user?.role === "AGENT" && tab === "my-players",
  });

  const dashboard = dashboardData?.data || dashboardData;
  const players = playersData?.data?.data || playersData?.data || [];
  const playersMeta = playersData?.meta || playersData?.data?.meta;

  const tabs = ["dashboard", "my-players", "create-player"];
  const tabLabels: Record<string, string> = {
    dashboard: "Dashboard", "my-players": "My Players", "create-player": "Create Player",
  };

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Agent Panel</h1>

      <div className="mb-6 flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-cyan-600 text-[#ffffff]"
                : "bg-[#2a2a2a] text-[#9ca3af] hover:text-white"
            }`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card min-w-0">
            <div className="text-sm text-[#6b7280]">Total Players</div>
            <div className="font-bold text-white text-xl sm:text-2xl min-w-0 overflow-hidden">
              <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)' }}>
                {dashboard?.playersCount ?? 0}
              </span>
            </div>
          </div>
          <div className="card min-w-0">
            <div className="text-sm text-[#6b7280]">Player Exposure</div>
            <div className="font-bold text-amber-400 text-xl sm:text-2xl min-w-0 overflow-hidden">
              <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)' }}>
                ${formatCurrency(dashboard?.ownExposure ?? 0, { compact: true })}
              </span>
            </div>
          </div>
          <div className="card min-w-0">
            <div className="text-sm text-[#6b7280]">Total P&L</div>
            <div className={`font-bold ${(dashboard?.totalPnL ?? 0) >= 0 ? "text-green-400" : "text-red-400"} text-xl sm:text-2xl min-w-0 overflow-hidden`}>
              <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)' }}>
                ${formatCurrency(dashboard?.totalPnL ?? 0, { compact: true })}
              </span>
            </div>
          </div>
          <div className="card min-w-0">
            <div className="text-sm text-[#6b7280]">Deposits</div>
            <div className="font-bold text-green-400 text-xl sm:text-2xl min-w-0 overflow-hidden">
              <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)' }}>
                ${formatCurrency(dashboard?.totalDeposits ?? 0, { compact: true })}
              </span>
            </div>
          </div>
          <div className="card min-w-0">
            <div className="text-sm text-[#6b7280]">Withdrawals</div>
            <div className="font-bold text-red-400 text-xl sm:text-2xl min-w-0 overflow-hidden">
              <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)' }}>
                ${formatCurrency(dashboard?.totalWithdrawals ?? 0, { compact: true })}
              </span>
            </div>
          </div>
        </div>
      )}

      {tab === "my-players" && (
        <AgentPlayersList
          players={players}
          meta={playersMeta}
          page={playersPage}
          setPage={setPlayersPage}
          search={playersSearch}
          setSearch={setPlayersSearch}
          isLoading={playersLoading}
          queryClient={queryClient}
        />
      )}

      {tab === "create-player" && <CreatePlayerForm />}
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel, variant }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
  confirmLabel?: string; variant?: "danger" | "primary";
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="mb-6 text-sm text-[#9ca3af]">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={variant === "danger" ? "btn bg-red-600 text-white hover:bg-red-500" : "btn-primary"}>
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerEditModal({ open, player, onClose, onSave }: {
  open: boolean; player: any; onClose: () => void; onSave: (data: any) => void;
}) {
  const [displayName, setDisplayName] = useState(player?.displayName || '');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-white">Edit Player: {player?.username}</h3>
        <div>
          <label className="text-sm text-[#9ca3af]">Display Name</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input mt-1 w-full" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave({ displayName: displayName || undefined })} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}

function PlayerResetPwdModal({ open, player, onClose, onSave }: {
  open: boolean; player: any; onClose: () => void; onSave: (data: any) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-white">Reset Password: {player?.username}</h3>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" minLength={8} className="input mt-1 w-full" />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onSave({ newPassword }); setNewPassword(""); }} disabled={newPassword.length < 8} className="btn-primary">Reset</button>
        </div>
      </div>
    </div>
  );
}

function AgentPlayersList({ players, meta, page, setPage, search, setSearch, isLoading, queryClient }: {
  players: any[]; meta: any; page: number; setPage: (p: number) => void;
  search: string; setSearch: (s: string) => void; isLoading: boolean; queryClient: any;
}) {
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [editTarget, setEditTarget] = useState<any>(null);
  const [resetPwdTarget, setResetPwdTarget] = useState<any>(null);
  const [showActions, setShowActions] = useState<string | null>(null);

  const transferMutation = useMutation({
    mutationFn: ({ toUserId, amount }: { toUserId: string; amount: number }) =>
      walletApi.transfer({ toUserId, amount, description: "Agent balance transfer" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-players"] });
      toast.success("Balance transferred successfully");
      setTransferTarget(null);
      setTransferAmount("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Transfer failed");
    },
  });

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (amount > 0 && transferTarget) {
      transferMutation.mutate({ toUserId: transferTarget.id, amount });
    }
  };

  const filtered = players.filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.username?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.displayName?.toLowerCase().includes(q);
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      hierarchyApi.updateStatus(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-players"] });
      toast.success("Player status updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    },
  });

  const deletePlayer = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      hierarchyApi.deleteUser(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-players"] });
      toast.success("Player deleted");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete");
      setDeleteTarget(null);
    },
  });

  const updatePlayer = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: any }) => hierarchyApi.updateUser(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-players"] });
      toast.success("Player updated");
      setEditTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update"),
  });

  const resetPwd = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: any }) => hierarchyApi.resetPassword(id, d),
    onSuccess: () => {
      toast.success("Password reset");
      setResetPwdTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to reset password"),
  });

  const depositMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: any }) => hierarchyApi.deposit(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-players"] });
      toast.success("Deposit successful");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Deposit failed"),
  });

  const handleDeposit = (player: any) => {
    const amount = prompt("Enter deposit amount:", "100");
    if (amount && parseFloat(amount) > 0) {
      depositMutation.mutate({ id: player.id, data: { amount: parseFloat(amount), description: "Agent deposit" } });
    }
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by username, email or display name..."
          className="input max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg h-14" />
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-left text-[#6b7280]">
                <th className="pb-2 pr-4">Username</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Display Name</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Created</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-b border-slate-700/50">
                  <td className="py-3 pr-4 font-medium text-white">{p.username}</td>
                  <td className="py-3 pr-4 text-[#6b7280]">{p.email}</td>
                  <td className="py-3 pr-4 text-[#d1d5db]">{p.displayName || "—"}</td>
                  <td className="py-3 pr-4">
                    <span className={p.status === 'ACTIVE' ? "text-green-400" : "text-red-400"}>
                      {p.status === 'ACTIVE' ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="py-3 text-[#6b7280]">{formatDate(p.createdAt)}</td>
                  <td className="py-3 relative">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowActions(showActions === p.id ? null : p.id)}
                        className="text-sm text-cyan-400 hover:text-cyan-400/80 transition-colors"
                      >
                        Actions ▾
                      </button>
                      {showActions === p.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1" onMouseLeave={() => setShowActions(null)}>
                          <button onClick={() => { setShowActions(null); setEditTarget(p); }} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">Edit</button>
                          <button onClick={() => { setShowActions(null); handleDeposit(p); }} className="w-full text-left px-3 py-1.5 text-xs text-emerald-400 hover:bg-gray-700">Deposit</button>
                          <button onClick={() => { setShowActions(null); setTransferTarget(p); setTransferAmount(""); }} className="w-full text-left px-3 py-1.5 text-xs text-cyan-400 hover:bg-gray-700">Transfer</button>
                          <button onClick={() => { setShowActions(null); setResetPwdTarget(p); }} className="w-full text-left px-3 py-1.5 text-xs text-purple-400 hover:bg-gray-700">Reset Pwd</button>
                          <button
                            onClick={() => { setShowActions(null); updateStatus.mutate({ id: p.id, isActive: p.status !== 'ACTIVE' }); }}
                            className={`w-full text-left px-3 py-1.5 text-xs ${p.status === 'ACTIVE' ? "text-amber-400 hover:bg-gray-700" : "text-green-400 hover:bg-gray-700"}`}
                          >
                            {p.status === 'ACTIVE' ? "Suspend" : "Activate"}
                          </button>
                          <button onClick={() => { setShowActions(null); setDeleteTarget(p); }} className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700">Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6b7280]">
                    {search ? "No players match your search" : "No players found"}
                  </td>
                </tr>
              )}
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

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Player"
        message={`Are you sure you want to delete "${deleteTarget?.username}" (${deleteTarget?.email})? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deletePlayer.mutate({ id: deleteTarget.id })}
        onCancel={() => setDeleteTarget(null)}
      />

      <TransferModal
        open={!!transferTarget}
        title={`Transfer Balance to ${transferTarget?.username || ""}`}
        amount={transferAmount}
        onAmountChange={setTransferAmount}
        onConfirm={handleTransfer}
        onCancel={() => { setTransferTarget(null); setTransferAmount(""); }}
        loading={transferMutation.isPending}
      />

      <PlayerEditModal
        open={!!editTarget}
        player={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={(data) => updatePlayer.mutate({ id: editTarget.id, data })}
      />

      <PlayerResetPwdModal
        open={!!resetPwdTarget}
        player={resetPwdTarget}
        onClose={() => setResetPwdTarget(null)}
        onSave={(data) => resetPwd.mutate({ id: resetPwdTarget.id, data })}
      />
    </div>
  );
}

function TransferModal({ open, title, amount, onAmountChange, onConfirm, onCancel, loading }: {
  open: boolean; title: string; amount: string; onAmountChange: (v: string) => void;
  onConfirm: (e: React.FormEvent) => void; onCancel: () => void; loading: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const numAmount = parseFloat(amount) || 0;
  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirming) { setConfirming(true); return; }
    setConfirming(false);
    onConfirm(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          {!confirming ? (
            <div className="mb-4">
              <label className="text-sm text-[#9ca3af]">Amount *</label>
              <input type="number" value={amount} onChange={(e) => onAmountChange(e.target.value)} className="input mt-1" min="0.01" step="0.01" required autoFocus />
            </div>
          ) : (
            <div className="mb-4 rounded-lg bg-slate-700/30 p-3 text-sm text-[#d1d5db] whitespace-pre-line">
              Transfer ${formatCurrency(numAmount)} to this user.{"\n\n"}Click &quot;Confirm Transfer&quot; to proceed.
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setConfirming(false); onCancel(); }} className="btn-secondary">{confirming ? "Back" : "Cancel"}</button>
            <button type="submit" disabled={loading || !amount} className="btn-primary">
              {loading ? "Transferring..." : confirming ? "Confirm Transfer" : "Review Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreatePlayerForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: "", username: "", password: "", displayName: "" });

  const createPlayer = useMutation({
    mutationFn: (data: any) => hierarchyApi.createPlayer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-players"] });
      toast.success("Player created successfully");
      setForm({ email: "", username: "", password: "", displayName: "" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create player");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlayer.mutate({ email: form.email, username: form.username, password: form.password, displayName: form.displayName || undefined });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-semibold text-white">Create Player</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div><label className="text-sm text-[#9ca3af]">Email *</label><input type="email" value={form.email} onChange={set("email")} className="input mt-1" required /></div>
        <div><label className="text-sm text-[#9ca3af]">Username *</label><input type="text" value={form.username} onChange={set("username")} className="input mt-1" required /></div>
        <div><label className="text-sm text-[#9ca3af]">Password *</label><input type="password" value={form.password} onChange={set("password")} className="input mt-1" required /></div>
        <div><label className="text-sm text-[#9ca3af]">Display Name</label><input type="text" value={form.displayName} onChange={set("displayName")} className="input mt-1" /></div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={createPlayer.isPending} className="btn-primary">{createPlayer.isPending ? "Creating..." : "Create Player"}</button>
        </div>
      </form>
    </div>
  );
}

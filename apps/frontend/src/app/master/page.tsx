"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hierarchyApi, walletApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function MasterPage() {
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
    if (!isAuthenticated || user?.role !== "MASTER_ID") {
      router.push("/");
    }
  }, [hydrated, isAuthenticated, user, router]);

  const { data: dashboardData } = useQuery({
    queryKey: ["hierarchy", "master-dashboard"],
    queryFn: () => hierarchyApi.getMasterDashboard().then((r) => r.data),
    enabled: isAuthenticated && user?.role === "MASTER_ID" && tab === "dashboard",
  });

  const [agentsPage, setAgentsPage] = useState(1);
  const [agentsSearch, setAgentsSearch] = useState("");

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ["hierarchy", "my-agents", agentsPage, agentsSearch],
    queryFn: () => hierarchyApi.getMyAgents({ page: agentsPage, limit: 20, search: agentsSearch || undefined }).then((r) => r.data),
    enabled: isAuthenticated && user?.role === "MASTER_ID" && tab === "my-agents",
  });

  const { data: treeData } = useQuery({
    queryKey: ["hierarchy", "tree"],
    queryFn: () => hierarchyApi.getTree().then((r) => r.data),
    enabled: isAuthenticated && user?.role === "MASTER_ID" && tab === "hierarchy-tree",
  });

  const dashboard = dashboardData?.data || dashboardData;
  const agents = agentsData?.data?.data || agentsData?.data || [];
  const agentsMeta = agentsData?.meta || agentsData?.data?.meta;
  const hierarchyTree = treeData?.data || treeData;

  const tabs = ["dashboard", "my-agents", "create-agent", "hierarchy-tree"];
  const tabLabels: Record<string, string> = {
    dashboard: "Dashboard", "my-agents": "My Agents", "create-agent": "Create Agent", "hierarchy-tree": "Hierarchy Tree",
  };

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Master Panel</h1>

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
            <div className="text-sm text-[#6b7280]">Total Agents</div>
            <div className="font-bold text-white text-xl sm:text-2xl min-w-0 overflow-hidden">
              <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)' }}>
                {dashboard?.agentsCount ?? 0}
              </span>
            </div>
          </div>
          <div className="card min-w-0">
            <div className="text-sm text-[#6b7280]">Total Players</div>
            <div className="font-bold text-cyan-400 text-xl sm:text-2xl min-w-0 overflow-hidden">
              <span className="inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)' }}>
                {dashboard?.playersCount ?? 0}
              </span>
            </div>
          </div>
          <div className="card min-w-0">
            <div className="text-sm text-[#6b7280]">Agent Exposure</div>
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

      {tab === "my-agents" && (
        <MasterAgentsList
          agents={agents}
          meta={agentsMeta}
          page={agentsPage}
          setPage={setAgentsPage}
          search={agentsSearch}
          setSearch={setAgentsSearch}
          isLoading={agentsLoading}
          queryClient={queryClient}
        />
      )}

      {tab === "create-agent" && <CreateAgentForm />}

      {tab === "hierarchy-tree" && <MasterTreeView tree={hierarchyTree} />}
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

function AgentEditModal({ open, agent, onClose, onSave }: {
  open: boolean; agent: any; onClose: () => void; onSave: (data: any) => void;
}) {
  const [commissionRate, setCommissionRate] = useState(String(agent?.commissionRate ?? ''));
  const [creditLimit, setCreditLimit] = useState(String(agent?.creditLimit ?? ''));
  const [exposureLimit, setExposureLimit] = useState(String(agent?.exposureLimit ?? ''));
  const [maxPlayerCount, setMaxPlayerCount] = useState(String(agent?.maxPlayerCount ?? ''));

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-white">Edit Agent: {agent?.username}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-[#9ca3af]">Commission Rate (%)</label>
            <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="input mt-1" min="0" max="100" step="0.1" />
          </div>
          <div>
            <label className="text-sm text-[#9ca3af]">Credit Limit</label>
            <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} className="input mt-1" min="0" step="0.01" />
          </div>
          <div>
            <label className="text-sm text-[#9ca3af]">Exposure Limit</label>
            <input type="number" value={exposureLimit} onChange={(e) => setExposureLimit(e.target.value)} className="input mt-1" min="0" step="0.01" />
          </div>
          <div>
            <label className="text-sm text-[#9ca3af]">Max Players</label>
            <input type="number" value={maxPlayerCount} onChange={(e) => setMaxPlayerCount(e.target.value)} className="input mt-1" min="1" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => {
            const payload: any = {};
            if (commissionRate) payload.commissionRate = parseFloat(commissionRate);
            if (creditLimit) payload.creditLimit = parseFloat(creditLimit);
            if (exposureLimit) payload.exposureLimit = parseFloat(exposureLimit);
            if (maxPlayerCount) payload.maxPlayerCount = parseInt(maxPlayerCount);
            onSave(payload);
          }} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}

function AgentResetPwdModal({ open, agent, onClose, onSave }: {
  open: boolean; agent: any; onClose: () => void; onSave: (data: any) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-white">Reset Password: {agent?.username}</h3>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" minLength={8} className="input mt-1 w-full" />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onSave({ newPassword }); setNewPassword(""); }} disabled={newPassword.length < 8} className="btn-primary">Reset</button>
        </div>
      </div>
    </div>
  );
}

function MasterAgentsList({ agents, meta, page, setPage, search, setSearch, isLoading, queryClient }: {
  agents: any[]; meta: any; page: number; setPage: (p: number) => void;
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
      walletApi.transfer({ toUserId, amount, description: "Master balance transfer" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-agents"] });
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

  const filtered = agents.filter((a: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.username?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.role?.toLowerCase().includes(q)
    );
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      hierarchyApi.updateStatus(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-agents"] });
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "tree"] });
      toast.success("Agent status updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    },
  });

  const deleteAgent = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      hierarchyApi.deleteUser(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-agents"] });
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "tree"] });
      toast.success("Agent deleted");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to delete";
      toast.error(msg);
      setDeleteTarget(null);
    },
  });

  const updateAgent = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: any }) => hierarchyApi.updateUser(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-agents"] });
      toast.success("Agent updated");
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
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-agents"] });
      toast.success("Deposit successful");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Deposit failed"),
  });

  const handleDeposit = (agent: any) => {
    const amount = prompt("Enter deposit amount:", "100");
    if (amount && parseFloat(amount) > 0) {
      depositMutation.mutate({ id: agent.id, data: { amount: parseFloat(amount), description: "Master deposit" } });
    }
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by username, email or role..."
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
                <th className="pb-2 pr-4">Commission</th>
                <th className="pb-2 pr-4">Credit Limit</th>
                <th className="pb-2 pr-4">Exposure Limit</th>
                <th className="pb-2 pr-4">Players</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a: any) => (
                <tr key={a.id} className="border-b border-slate-700/50">
                  <td className="py-3 pr-4 font-medium text-white">{a.username}</td>
                  <td className="py-3 pr-4 text-[#6b7280]">{a.email}</td>
                  <td className="py-3 pr-4 text-[#d1d5db]">{a.commissionRate ?? 0}%</td>
                  <td className="py-3 pr-4 text-white">${formatCurrency(a.creditLimit ?? 0)}</td>
                  <td className="py-3 pr-4 text-white">${formatCurrency(a.exposureLimit ?? 0)}</td>
                  <td className="py-3 pr-4 text-[#d1d5db]">{a.playerCount ?? 0}</td>
                  <td className="py-3 pr-4">
                    <span className={a.status === 'ACTIVE' ? "text-green-400" : "text-red-400"}>
                      {a.status === 'ACTIVE' ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="py-3 relative">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowActions(showActions === a.id ? null : a.id)}
                        className="text-sm text-cyan-400 hover:text-cyan-400/80 transition-colors"
                      >
                        Actions ▾
                      </button>
                      {showActions === a.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1" onMouseLeave={() => setShowActions(null)}>
                          <button onClick={() => { setShowActions(null); setEditTarget(a); }} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">Edit</button>
                          <button onClick={() => { setShowActions(null); handleDeposit(a); }} className="w-full text-left px-3 py-1.5 text-xs text-emerald-400 hover:bg-gray-700">Deposit</button>
                          <button onClick={() => { setShowActions(null); setTransferTarget(a); setTransferAmount(""); }} className="w-full text-left px-3 py-1.5 text-xs text-cyan-400 hover:bg-gray-700">Transfer</button>
                          <button onClick={() => { setShowActions(null); setResetPwdTarget(a); }} className="w-full text-left px-3 py-1.5 text-xs text-purple-400 hover:bg-gray-700">Reset Pwd</button>
                          <button
                            onClick={() => { setShowActions(null); updateStatus.mutate({ id: a.id, isActive: a.status !== 'ACTIVE' }); }}
                            className={`w-full text-left px-3 py-1.5 text-xs ${a.status === 'ACTIVE' ? "text-amber-400 hover:bg-gray-700" : "text-green-400 hover:bg-gray-700"}`}
                          >
                            {a.status === 'ACTIVE' ? "Suspend" : "Activate"}
                          </button>
                          <button onClick={() => { setShowActions(null); setDeleteTarget(a); }} className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700">Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6b7280]">
                    {search ? "No agents match your search" : "No agents found"}
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
        title="Delete Agent"
        message={`Are you sure you want to delete "${deleteTarget?.username}" (${deleteTarget?.email})? This action cannot be undone.${(deleteTarget?.playerCount ?? 0) > 0 ? ` This agent has ${deleteTarget?.playerCount} player(s). Use force delete to remove anyway.` : ""}`}
        confirmLabel={(deleteTarget?.playerCount ?? 0) > 0 ? "Force Delete" : "Delete"}
        variant="danger"
        onConfirm={() => deleteAgent.mutate({ id: deleteTarget.id, force: (deleteTarget?.playerCount ?? 0) > 0 })}
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

      <AgentEditModal
        open={!!editTarget}
        agent={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={(data) => updateAgent.mutate({ id: editTarget.id, data })}
      />

      <AgentResetPwdModal
        open={!!resetPwdTarget}
        agent={resetPwdTarget}
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

function CreateAgentForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    email: "", username: "", password: "", displayName: "",
    commissionRate: "", creditLimit: "", exposureLimit: "", maxPlayerCount: "",
  });

  const createAgent = useMutation({
    mutationFn: (data: any) => hierarchyApi.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "my-agents"] });
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "tree"] });
      toast.success("Agent created successfully");
      setForm({ email: "", username: "", password: "", displayName: "", commissionRate: "", creditLimit: "", exposureLimit: "", maxPlayerCount: "" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create agent");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { email: form.email, username: form.username, password: form.password, displayName: form.displayName || undefined };
    if (form.commissionRate) payload.commissionRate = parseFloat(form.commissionRate);
    if (form.creditLimit) payload.creditLimit = parseFloat(form.creditLimit);
    if (form.exposureLimit) payload.exposureLimit = parseFloat(form.exposureLimit);
    if (form.maxPlayerCount) payload.maxPlayerCount = parseInt(form.maxPlayerCount);
    createAgent.mutate(payload);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-semibold text-white">Create Agent</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div><label className="text-sm text-[#9ca3af]">Email *</label><input type="email" value={form.email} onChange={set("email")} className="input mt-1" required /></div>
        <div><label className="text-sm text-[#9ca3af]">Username *</label><input type="text" value={form.username} onChange={set("username")} className="input mt-1" required /></div>
        <div><label className="text-sm text-[#9ca3af]">Password *</label><input type="password" value={form.password} onChange={set("password")} className="input mt-1" required /></div>
        <div><label className="text-sm text-[#9ca3af]">Display Name</label><input type="text" value={form.displayName} onChange={set("displayName")} className="input mt-1" /></div>
        <div><label className="text-sm text-[#9ca3af]">Commission Rate (%)</label><input type="number" value={form.commissionRate} onChange={set("commissionRate")} className="input mt-1" min="0" max="100" step="0.1" /></div>
        <div><label className="text-sm text-[#9ca3af]">Credit Limit</label><input type="number" value={form.creditLimit} onChange={set("creditLimit")} className="input mt-1" min="0" step="0.01" /></div>
        <div><label className="text-sm text-[#9ca3af]">Exposure Limit</label><input type="number" value={form.exposureLimit} onChange={set("exposureLimit")} className="input mt-1" min="0" step="0.01" /></div>
        <div><label className="text-sm text-[#9ca3af]">Max Players</label><input type="number" value={form.maxPlayerCount} onChange={set("maxPlayerCount")} className="input mt-1" min="1" /></div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={createAgent.isPending} className="btn-primary">{createAgent.isPending ? "Creating..." : "Create Agent"}</button>
        </div>
      </form>
    </div>
  );
}

function MasterTreeView({ tree }: { tree: any }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (tree?.id) setExpanded(new Set([tree.id]));
  }, [tree?.id]);

  const renderNode = (node: any, depth: number) => {
    if (!node) return null;
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const levelColors: Record<string, string> = {
      LEVEL_2_MASTER: "text-cyan-400",
      LEVEL_3_AGENT: "text-amber-400",
      LEVEL_4_PLAYER: "text-green-400",
    };

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-1.5 hover:bg-slate-700/30 rounded px-2 cursor-pointer transition-colors"
          style={{ paddingLeft: `${depth * 24 + 8}px` }}
          onClick={() => hasChildren && toggle(node.id)}
        >
          {hasChildren ? <span className="text-[#6b7280] text-xs w-4">{isExpanded ? "▼" : "▶"}</span> : <span className="w-4" />}
          <span className="text-sm font-medium text-white">{node.user?.username}</span>
          <span className={`text-xs ${levelColors[node.level] || "text-[#6b7280]"}`}>{node.level?.replace("LEVEL_", "").replace("_", " ") || node.user?.role}</span>
          {node.commissionRate > 0 && <span className="text-xs text-[#6b7280]">{node.commissionRate}% comm</span>}
        </div>
        {isExpanded && hasChildren && <div>{node.children.map((child: any) => renderNode(child, depth + 1))}</div>}
      </div>
    );
  };

  if (!tree) {
    return <div className="card"><p className="text-center text-[#6b7280]">No hierarchy data available</p></div>;
  }

  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-semibold text-white">Hierarchy Tree</h2>
      <div className="max-h-[600px] overflow-y-auto">{renderNode(tree, 0)}</div>
    </div>
  );
}

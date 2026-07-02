import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const API_URL = "/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
      try {
        const { data: refreshRes } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        const newAccessToken = refreshRes?.data?.accessToken ?? refreshRes?.accessToken;
        const newRefreshToken = refreshRes?.data?.refreshToken ?? refreshRes?.refreshToken;
        if (!newAccessToken || !newRefreshToken) throw new Error("Invalid refresh response");
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    if (!error.response && !originalRequest._networkRetry) {
      originalRequest._networkRetry = true;
      await new Promise((r) => setTimeout(r, 2000));
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data: { email: string; username: string; password: string; displayName?: string; referralCode?: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
  logout: () => api.post("/auth/logout"),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),
};

export const usersApi = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data: { displayName?: string }) =>
    api.patch("/users/profile", data),
};

export const walletApi = {
  getWallet: () => api.get("/wallet"),
  deposit: (data: { amount: number; reference?: string; description?: string }) =>
    api.post("/wallet/deposit", data),
  withdraw: (data: { amount: number; reference?: string; description?: string }) =>
    api.post("/wallet/withdraw", data),
  getTransactions: (params?: { page?: number; limit?: number }) =>
    api.get("/wallet/transactions", { params }),
  addBalance: (data: { userId: string; amount: number; description?: string }) =>
    api.post("/wallet/add-balance", data),
  deductBalance: (data: { userId: string; amount: number; description?: string }) =>
    api.post("/wallet/deduct-balance", data),
  transfer: (data: { toUserId: string; amount: number; description?: string }) =>
    api.post("/wallet/transfer", data),
};

export const sportsApi = {
  getAll: () => api.get("/sports"),
  getBySlug: (slug: string) => api.get(`/sports/${slug}`),
  getLeagues: (slug: string) => api.get(`/sports/${slug}/leagues`),
  getMatches: (slug: string) => api.get(`/sports/${slug}/matches`),
};

export const matchesApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get("/matches", { params }),
  getLive: () => api.get("/matches/live"),
  getUpcoming: (params?: { page?: number; limit?: number }) =>
    api.get("/matches/upcoming", { params }),
  getById: (id: string) => api.get(`/matches/${id}`),
};

export const betsApi = {
  placeBet: (data: { stake: number; type: "SINGLE" | "MULTI"; legs: { marketId: string; oddsId: string }[] }) =>
    api.post("/bets", data),
  getBets: (params?: { page?: number; limit?: number }) =>
    api.get("/bets", { params }),
  getActive: () => api.get("/bets/active"),
  getById: (id: string) => api.get(`/bets/${id}`),
  cashout: (id: string) => api.post(`/bets/${id}/cashout`),
};

export const referralsApi = {
  getStats: () => api.get("/referrals"),
  getCode: () => api.get("/referrals/code"),
  getHistory: () => api.get("/referrals/history"),
};

export const leaderboardApi = {
  getAllTime: (limit?: number) => api.get("/leaderboard", { params: { limit } }),
  getWeekly: (limit?: number) =>
    api.get("/leaderboard/weekly", { params: { limit } }),
};

export const notificationsApi = {
  getAll: () => api.get("/notifications"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
};

export const homeApi = {
  getTrending: (limit?: number) => api.get("/home/trending", { params: { limit } }),
  getFeatured: (limit?: number) => api.get("/home/featured", { params: { limit } }),
  getRecentWinners: (limit?: number) => api.get("/home/recent-winners", { params: { limit } }),
  getSummary: () => api.get("/home/summary"),
};

export const casinoApi = {
  getCategories: () => api.get("/casino/categories"),
  getGames: (params?: { category?: string; featured?: string; popular?: string; search?: string; limit?: number }) =>
    api.get("/casino/games", { params }),
  getGameBySlug: (slug: string) => api.get(`/casino/games/${slug}`),
  getPromotions: () => api.get("/casino/promotions"),
  getFeatured: (limit?: number) => api.get("/casino/featured", { params: { limit } }),
  play: (data: { gameSlug: string; betAmount: number; betData?: Record<string, any> }) =>
    api.post("/casino/play", data),
  blackjackHit: (sessionId: string) => api.post("/casino/blackjack/hit", { sessionId }),
  blackjackStand: (sessionId: string) => api.post("/casino/blackjack/stand", { sessionId }),
  getSessions: (params?: { page?: number; limit?: number }) =>
    api.get("/casino/sessions", { params }),
  getSession: (id: string) => api.get(`/casino/sessions/${id}`),
  getWinners: (limit?: number) => api.get("/casino/winners", { params: { limit } }),
  getTrending: (limit?: number) => api.get("/casino/trending", { params: { limit } }),
  getNewReleases: (limit?: number) => api.get("/casino/new-releases", { params: { limit } }),
  getRecentlyPlayed: (limit?: number) => api.get("/casino/recently-played", { params: { limit } }),
  getLeaderboard: (limit?: number) => api.get("/casino/leaderboard", { params: { limit } }),
  getStats: () => api.get("/casino/stats"),
};

export const hierarchyApi = {
  getTree: () => api.get("/hierarchy/tree"),
  getUserTree: (id: string) => api.get(`/hierarchy/users/${id}/tree`),
  getMasters: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/hierarchy/masters", { params }),
  createMaster: (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    commissionRate?: number;
    creditLimit?: number;
    exposureLimit?: number;
    maxPlayerCount?: number;
  }) => api.post("/hierarchy/masters", data),
  createAgent: (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    commissionRate?: number;
    creditLimit?: number;
    exposureLimit?: number;
    maxPlayerCount?: number;
  }) => api.post("/hierarchy/agents", data),
  getMyAgents: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/hierarchy/my-agents", { params }),
  createPlayer: (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }) => api.post("/hierarchy/players", data),
  getMyPlayers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/hierarchy/my-players", { params }),
  updateCommission: (id: string, data: { commissionRate: number }) =>
    api.patch(`/hierarchy/users/${id}/commission`, data),
  updateStatus: (id: string, data: { isActive: boolean }) =>
    api.patch(`/hierarchy/users/${id}/status`, data),
  deleteUser: (id: string, force?: boolean) =>
    api.delete(`/hierarchy/users/${id}`, { params: { force } }),
  getAnalytics: () => api.get("/hierarchy/analytics"),
  getAuditLogs: (params?: { page?: number; limit?: number }) =>
    api.get("/hierarchy/audit-logs", { params }),
  getAdminDashboard: () => api.get("/hierarchy/dashboard/admin"),
  getMasterDashboard: () => api.get("/hierarchy/dashboard/master"),
  getAgentDashboard: () => api.get("/hierarchy/dashboard/agent"),
  getPlayerDashboard: () => api.get("/hierarchy/dashboard/player"),
  getUserDetail: (id: string) => api.get(`/hierarchy/users/${id}`),
  updateUser: (id: string, data: {
    commissionRate?: number;
    creditLimit?: number;
    exposureLimit?: number;
    maxPlayerCount?: number;
  }) => api.patch(`/hierarchy/users/${id}`, data),
  resetPassword: (id: string, data: { newPassword: string }) =>
    api.post(`/hierarchy/users/${id}/reset-password`, data),
  moveUser: (id: string, data: { targetParentId: string }) =>
    api.post(`/hierarchy/users/${id}/move`, data),
  deposit: (id: string, data: { amount: number; description?: string }) =>
    api.post(`/hierarchy/users/${id}/deposit`, data),
  withdraw: (id: string, data: { amount: number; description?: string }) =>
    api.post(`/hierarchy/users/${id}/withdraw`, data),
};

export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: (params?: { page?: number; limit?: number; search?: string; status?: string; role?: string; masterId?: string; agentId?: string }) =>
    api.get("/admin/users", { params }),
  getUserDetail: (id: string) => api.get(`/admin/users/${id}`),
  suspendUser: (id: string, data: { reasonType: string; reason: string }) =>
    api.patch(`/admin/users/${id}/suspend`, data),
  reactivateUser: (id: string, data?: { reason?: string }) =>
    api.patch(`/admin/users/${id}/reactivate`, data || {}),
  softDeleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  resetPassword: (id: string, data: { newPassword: string }) =>
    api.post(`/admin/users/${id}/reset-password`, data),
  deposit: (data: { userId: string; amount: number; description?: string }) =>
    api.post("/admin/wallet/deposit", data),
  withdraw: (data: { userId: string; amount: number; description?: string }) =>
    api.post("/admin/wallet/withdraw", data),
  transfer: (data: { fromUserId: string; toUserId: string; amount: number; description?: string }) =>
    api.post("/admin/wallet/transfer", data),
  getDepositReport: (params?: any) => api.get("/admin/reports/deposits", { params }),
  getWithdrawalReport: (params?: any) => api.get("/admin/reports/withdrawals", { params }),
  getTransactionReport: (params?: any) => api.get("/admin/reports/transactions", { params }),
  getBetReport: (params?: any) => api.get("/admin/reports/bets", { params }),
  getCommissionReport: (params?: any) => api.get("/admin/reports/commissions", { params }),
  getRevenueReport: (params?: any) => api.get("/admin/reports/revenue", { params }),
  getHierarchyReport: (params?: any) => api.get("/admin/reports/hierarchy", { params }),
  getAuditLogs: (params?: any) => api.get("/admin/audit-logs", { params }),
  getOnlineUsers: () => api.get("/admin/online-users"),
  createMatch: (data: any) => api.post("/admin/matches", data),
  updateMatch: (id: string, data: any) => api.patch(`/admin/matches/${id}`, data),
  addMarket: (matchId: string, data: any) =>
    api.post(`/admin/matches/${matchId}/markets`, data),
  updateOdds: (id: string, data: any) => api.patch(`/admin/odds/${id}`, data),
  getTransactions: (params?: { page?: number; limit?: number }) =>
    api.get("/admin/transactions", { params }),
};

export const oddsApi = {
  getSports: () => api.get("/odds/sports"),
  getLive: () => api.get("/odds/live"),
  getBySport: (sport: string) => api.get(`/odds/${sport}`),
  getEvent: (eventId: string) => api.get(`/odds/events/${eventId}`),
  placeBet: (data: { eventId: string; marketKey: string; outcomeName: string; odds: number; stake: number }) =>
    api.post("/odds/bet", data),
};

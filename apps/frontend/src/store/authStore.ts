import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  referralCode: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      setUser: (user) =>
        set({ user, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => {
        if (!accessToken || !refreshToken) return;
        set({ accessToken, refreshToken });
        setCookie("accessToken", accessToken, 604800);
        setCookie("refreshToken", refreshToken, 604800);
      },
      logout: () => {
        removeCookie("accessToken");
        removeCookie("refreshToken");
        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi, usersApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function useLogin() {
  const { setUser, setTokens } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authApi.login(data).then((r) => r.data),
    onSuccess: (res) => {
      const innerData = res?.data?.data ?? res?.data;
      if (!innerData?.accessToken || !innerData?.refreshToken) {
        toast.error("Invalid login response: missing tokens");
        return;
      }
      setTokens(innerData.accessToken, innerData.refreshToken);
      if (innerData.user) setUser(innerData.user);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Logged in successfully");
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      router.push(redirect);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Login failed");
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: {
      email: string;
      username: string;
      password: string;
      displayName?: string;
      referralCode?: string;
    }) => authApi.register(data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Registered successfully. Please login.");
      router.push("/login");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Registration failed");
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      router.push("/login");
    },
  });
}

export function useProfile() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["profile"],
    queryFn: () => usersApi.getProfile().then((r) => r.data),
    enabled: !!user,
  });
}

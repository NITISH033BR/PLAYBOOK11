"use client";

import { useState } from "react";
import Link from "next/link";
import { useRegister } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    referralCode: "",
  });
  const register = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return;
    }
    register.mutate({
      email: form.email,
      username: form.username,
      password: form.password,
      displayName: form.displayName || undefined,
      referralCode: form.referralCode || undefined,
    });
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md px-4"
    >
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 shadow-lg shadow-cyan-500/25">
            <span className="text-2xl font-black text-white">P</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="mt-1 text-sm text-slate-400">Join the action today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300">Email *</label>
            <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="input mt-1.5" required autoComplete="email" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300">Username *</label>
            <input type="text" value={form.username} onChange={(e) => updateField("username", e.target.value)} className="input mt-1.5" minLength={3} required autoComplete="username" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300">Display Name</label>
            <input type="text" value={form.displayName} onChange={(e) => updateField("displayName", e.target.value)} className="input mt-1.5" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300">Password *</label>
            <input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} className="input mt-1.5" minLength={8} required autoComplete="new-password" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300">Confirm Password *</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} className="input mt-1.5" minLength={8} required autoComplete="new-password" />
            {form.password !== form.confirmPassword && form.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300">Referral Code (optional)</label>
            <input type="text" value={form.referralCode} onChange={(e) => updateField("referralCode", e.target.value)} className="input mt-1.5" maxLength={20} />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={register.isPending}
            className="w-full rounded-xl bg-cyan-600 py-3 text-base font-bold text-white hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
          >
            {register.isPending ? "Creating account..." : "Create Account"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

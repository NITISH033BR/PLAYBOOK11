"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BetSlip } from "@/components/betting/BetSlip";
import { WalletModal } from "@/components/wallet/WalletModal";

const authPagePaths = ["/login", "/register"];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen text-slate-100 antialiased" style={{ background: "#0B1220" }}>
        <QueryClientProvider client={queryClient}>
          <AppLayout>{children}</AppLayout>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#111827",
                color: "#fff",
                border: "1px solid #334155",
              },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = authPagePaths.includes(pathname);

  if (isAuthPage) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#0B1220" }}>
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">{children}</div>
        </main>
      </div>
      <BetSlip />
      <WalletModal />
    </div>
  );
}

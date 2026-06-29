"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
      <p className="text-sm text-[#6b7280]">An unexpected error occurred. Please try again.</p>
      <button onClick={reset} className="btn-primary">
        Try again
      </button>
    </div>
  );
}

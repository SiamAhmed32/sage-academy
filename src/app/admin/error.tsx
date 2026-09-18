"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md rounded-2xl border border-sage-border bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-sage-secondary">Page could not be loaded</h2>
        <p className="mt-3 text-sm leading-6 text-sage-gray-600">
          There was a problem loading this admin page. Try again or return to
          the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-sage-primary px-5 py-2.5 text-sm font-bold text-white"
          >
            Try again
          </button>
          <a
            href="/admin"
            className="rounded-lg border border-sage-border px-5 py-2.5 text-sm font-bold text-sage-secondary"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type Result<T> = { ok: true; message: string; data?: T } | { ok: false; message: string };

/**
 * Runs a server action, shows a toast, refreshes server data and keeps the
 * last error for inline display (clash lists are multi-line).
 */
export function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function run<T>(
    action: () => Promise<Result<T>>,
    options: { onSuccess?: (data: T | undefined) => void; quiet?: boolean; refresh?: boolean } = {}
  ) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message.split("\n")[0]);
        return;
      }
      if (!options.quiet && result.message) toast.success(result.message);
      if (options.refresh !== false) router.refresh();
      options.onSuccess?.(result.data);
    });
  }

  return { pending, error, setError, run };
}

export function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  const [first, ...rest] = message.split("\n");
  return (
    <div className="notice danger" role="alert" style={{ marginBottom: 16 }}>
      <div>
        <strong style={{ display: "block" }}>{first}</strong>
        {rest.length > 0 ? (
          <ul>
            {rest.map((line) => (
              <li key={line}>{line.replace(/^•\s*/, "")}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

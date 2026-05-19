"use client";

import { useState } from "react";

export function BatchCreatePanel({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage-border bg-white p-4">
        <div>
          <h3 className="text-lg font-bold text-sage-secondary">ব্যাচ তৈরি</h3>
          <p className="mt-1 text-sm text-sage-gray-500">
            নতুন ব্যাচ দরকার হলে ফর্ম খুলুন, না হলে তালিকা থেকেই কাজ করুন।
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white"
        >
          {open ? "ফর্ম বন্ধ করুন" : "নতুন ব্যাচ"}
        </button>
      </div>

      {open ? (
        <div>
          {children}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mb-6 rounded-lg border border-sage-border bg-white px-4 py-2 text-sm font-bold text-sage-secondary"
          >
            বাতিল
          </button>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { BatchInfoModal } from "./BatchInfoModal";

export function BatchCreateButton() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage-border bg-white p-4">
        <div>
          <h3 className="text-lg font-bold text-sage-secondary">ব্যাচ তৈরি</h3>
          <p className="mt-1 text-sm text-sage-gray-500">
            নতুন ব্যাচ দরকার হলে বাটনে ক্লিক করুন, তারপর রুটিন টেবিল থেকে সেট করুন।
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white transition hover:bg-sage-primary/90"
        >
          <Plus size={16} /> নতুন ব্যাচ
        </button>
      </div>

      <BatchInfoModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

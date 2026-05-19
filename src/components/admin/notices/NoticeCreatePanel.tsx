"use client";

import { useState } from "react";

import { NoticeCreateForm, type NoticeBatchOption } from "./NoticeCreateForm";

export function NoticeCreatePanel({ batches }: { batches: NoticeBatchOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage-border bg-white p-4">
        <div>
          <h3 className="text-lg font-bold text-sage-secondary">নোটিশ পাঠান</h3>
          <p className="mt-1 text-sm text-sage-gray-500">
            শ্রেণি ও ব্যাচ বেছে নোটিশ পাঠান — শুধুমাত্র ওই ব্যাচের শিক্ষার্থীরা দেখবে।
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white hover:bg-sage-primary-hover"
        >
          {open ? "ফর্ম বন্ধ করুন" : "নতুন নোটিশ"}
        </button>
      </div>

      {open ? (
        <div>
          <NoticeCreateForm batches={batches} embedded onSuccess={() => setOpen(false)} />
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


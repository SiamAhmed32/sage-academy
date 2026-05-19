"use client";

import { BellPlus, X } from "lucide-react";
import { useState } from "react";

import { NoticeCreateForm, type NoticeBatchOption } from "./NoticeCreateForm";

export function NoticeCreateSheet({ batches }: { batches: NoticeBatchOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-sage-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-sage-primary-hover"
      >
        <BellPlus className="h-4 w-4" />
        নতুন নোটিশ
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex justify-end bg-black/40"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sage-border px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-sage-secondary">নতুন নোটিশ পাঠান</h3>
                <p className="text-sm text-sage-gray-500">শ্রেণি ও ব্যাচ বেছে নিন</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-sage-border p-2 text-sage-secondary hover:bg-sage-red-50"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NoticeCreateForm batches={batches} embedded onSuccess={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { Pencil, X } from "lucide-react";
import { useMemo, useState } from "react";

import { updateNoticeAction } from "@/app/admin/notices/actions";
import { classLevelOptions } from "@/constants/class-levels";
import type { NoticeBatchOption } from "./NoticeCreateForm";

export type AdminNoticeItem = {
  _id: string;
  title: string;
  type: string;
  audience: string;
  classLevel?: number;
  batch?: string | { _id: string; title?: string; batchCode?: string; classLevel?: number };
  topic?: string;
  details?: string;
  isPublished: boolean;
  examDate?: string;
  publishedAt?: string;
};

function batchId(batch: AdminNoticeItem["batch"]) {
  if (!batch) return "";
  return typeof batch === "string" ? batch : batch._id;
}

function toDateInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function NoticeEditDialog({
  notice,
  batches,
  compact,
}: {
  notice: AdminNoticeItem;
  batches: NoticeBatchOption[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [classLevel, setClassLevel] = useState(String(notice.classLevel ?? ""));
  const filteredBatches = useMemo(
    () => batches.filter((batch) => String(batch.classLevel) === classLevel),
    [batches, classLevel]
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "rounded-lg bg-sage-red-50 px-3 py-1 text-sm font-bold text-sage-primary hover:bg-sage-primary hover:text-white"
            : "inline-flex items-center gap-2 rounded-xl border border-sage-border px-4 py-2 text-sm font-bold text-sage-primary hover:bg-sage-red-50"
        }
        aria-label="সম্পাদনা"
      >
        {compact ? "এডিট" : (
          <>
            <Pencil className="h-4 w-4" />
            সম্পাদনা
          </>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-sage-border bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-sage-secondary">নোটিশ সম্পাদনা</h3>
            <p className="mt-1 text-sm text-sage-gray-500">ব্যাচ পরিবর্তন করলে শুধু নতুন ব্যাচের শিক্ষার্থীরা দেখবে।</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-sage-border p-2 text-sage-secondary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          action={async (formData) => {
            await updateNoticeAction(formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={notice._id} />
          <input type="hidden" name="audience" value="batch" />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-sm font-bold text-sage-secondary">শিরোনাম *</span>
              <input
                name="title"
                required
                defaultValue={notice.title}
                className="mt-2 h-11 w-full rounded-xl border border-sage-border px-4 text-sm outline-none focus:border-sage-primary"
              />
            </label>
            <label>
              <span className="text-sm font-bold text-sage-secondary">ধরন</span>
              <select
                name="type"
                defaultValue={notice.type}
                className="mt-2 h-11 w-full rounded-xl border border-sage-border px-4 text-sm outline-none focus:border-sage-primary"
              >
                <option value="general">সাধারণ</option>
                <option value="exam">পরীক্ষা / কুইজ</option>
                <option value="payment">পেমেন্ট</option>
              </select>
            </label>
            <label>
              <span className="text-sm font-bold text-sage-secondary">শ্রেণি *</span>
              <select
                name="classLevel"
                required
                value={classLevel}
                onChange={(event) => setClassLevel(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-sage-border px-4 text-sm outline-none focus:border-sage-primary"
              >
                <option value="">শ্রেণি বেছে নিন</option>
                {classLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="text-sm font-bold text-sage-secondary">ব্যাচ *</span>
              <select
                name="batch"
                required
                defaultValue={batchId(notice.batch)}
                className="mt-2 h-11 w-full rounded-xl border border-sage-border px-4 text-sm outline-none focus:border-sage-primary"
              >
                <option value="">ব্যাচ বেছে নিন</option>
                {filteredBatches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.batchCode || batch.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-bold text-sage-secondary">পরীক্ষার তারিখ</span>
              <input
                name="examDate"
                type="date"
                defaultValue={toDateInput(notice.examDate)}
                className="mt-2 h-11 w-full rounded-xl border border-sage-border px-4 text-sm outline-none focus:border-sage-primary"
              />
            </label>
            <label className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-bold text-sage-secondary">
                <input
                  name="isPublished"
                  type="checkbox"
                  defaultChecked={notice.isPublished}
                  className="h-4 w-4 accent-sage-primary"
                />
                প্রকাশিত রাখুন
              </label>
            </label>
            <label className="md:col-span-2">
              <span className="text-sm font-bold text-sage-secondary">টপিক</span>
              <input
                name="topic"
                defaultValue={notice.topic ?? ""}
                className="mt-2 h-11 w-full rounded-xl border border-sage-border px-4 text-sm outline-none focus:border-sage-primary"
              />
            </label>
            <label className="md:col-span-2">
              <span className="text-sm font-bold text-sage-secondary">বিস্তারিত</span>
              <textarea
                name="details"
                rows={4}
                defaultValue={notice.details ?? ""}
                className="mt-2 w-full rounded-xl border border-sage-border px-4 py-3 text-sm outline-none focus:border-sage-primary"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-sage-border px-5 py-2.5 text-sm font-bold text-sage-secondary"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="rounded-xl bg-sage-primary px-5 py-2.5 text-sm font-bold text-white"
            >
              আপডেট করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

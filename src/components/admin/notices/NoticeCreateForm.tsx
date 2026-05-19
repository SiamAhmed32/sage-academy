"use client";

import { BellPlus, Users } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { createNoticeAction } from "@/app/admin/notices/actions";
import { classLevelOptions } from "@/constants/class-levels";

export type NoticeBatchOption = {
  _id: string;
  title: string;
  batchCode?: string;
  classLevel: number;
  studentCount?: number;
};

const initialState = { ok: false, message: "" };

export function NoticeCreateForm({
  batches,
  embedded,
  onSuccess,
}: {
  batches: NoticeBatchOption[];
  embedded?: boolean;
  onSuccess?: () => void;
}) {
  const [classLevel, setClassLevel] = useState("");
  const [batchId, setBatchId] = useState("");
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      try {
        await createNoticeAction(formData);
        setClassLevel("");
        setBatchId("");
        onSuccess?.();
        return { ok: true, message: "নোটিশ সফলভাবে পাঠানো হয়েছে।" };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : "নোটিশ সেভ করা যায়নি।",
        };
      }
    },
    initialState
  );

  const filteredBatches = useMemo(
    () => batches.filter((batch) => String(batch.classLevel) === classLevel),
    [batches, classLevel]
  );
  const selectedBatch = filteredBatches.find((batch) => batch._id === batchId);

  return (
    <form
      action={formAction}
      className={embedded ? "space-y-6" : "overflow-hidden rounded-2xl border border-sage-border bg-white shadow-sm"}
    >
      {!embedded && (
      <div className="border-b border-sage-border bg-sage-red-50/40 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-white p-3 text-sage-primary shadow-sm">
            <BellPlus className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-sage-secondary">নতুন নোটিশ পাঠান</h2>
            <p className="mt-1 text-sm text-sage-gray-600">
              প্রথমে শ্রেণি ও ব্যাচ বেছে নিন, তারপর নোটিশের বিস্তারিত লিখুন।
            </p>
          </div>
        </div>
      </div>
      )}

      <div className={embedded ? "space-y-6" : "space-y-6 p-5 sm:p-6"}>
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-sage-primary">১. গ্রহীতা নির্বাচন</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-sage-secondary">শ্রেণি *</span>
              <select
                name="classLevel"
                required
                value={classLevel}
                onChange={(event) => {
                  setClassLevel(event.target.value);
                  setBatchId("");
                }}
                className="mt-2 h-11 w-full rounded-lg border border-sage-border bg-white px-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10"
              >
                <option value="">শ্রেণি বেছে নিন</option>
                {classLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-semibold text-sage-secondary">ব্যাচ *</span>
              <select
                name="batch"
                required
                value={batchId}
                disabled={!classLevel}
                onChange={(event) => setBatchId(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-sage-border bg-white px-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10 disabled:bg-sage-red-50/40"
              >
                <option value="">{classLevel ? "ব্যাচ বেছে নিন" : "আগে শ্রেণি বেছে নিন"}</option>
                {filteredBatches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.batchCode || batch.title}
                    {batch.studentCount !== undefined ? ` · ${batch.studentCount} জন শিক্ষার্থী` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedBatch && (
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <Users className="h-4 w-4 shrink-0" />
              <span>
                <strong>{selectedBatch.batchCode || selectedBatch.title}</strong> ব্যাচের{" "}
                <strong>{selectedBatch.studentCount ?? 0} জন</strong> ভর্তি শিক্ষার্থী এই নোটিশ দেখবে।
              </span>
            </p>
          )}
          {classLevel && !filteredBatches.length && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              এই শ্রেণিতে কোনো সক্রিয় ব্যাচ নেই।
            </p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-sage-primary">২. নোটিশের তথ্য</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-sage-secondary">শিরোনাম *</span>
              <input
                name="title"
                required
                placeholder="যেমন: সাপ্তাহিক পরীক্ষার নোটিশ"
                className="mt-2 h-11 w-full rounded-lg border border-sage-border px-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10"
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-sage-secondary">ধরন</span>
              <select
                name="type"
                className="mt-2 h-11 w-full rounded-lg border border-sage-border px-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10"
              >
                <option value="general">সাধারণ</option>
                <option value="exam">পরীক্ষা / কুইজ</option>
                <option value="payment">পেমেন্ট</option>
              </select>
            </label>
            <label>
              <span className="text-sm font-semibold text-sage-secondary">পরীক্ষার তারিখ</span>
              <input
                name="examDate"
                type="date"
                className="mt-2 h-11 w-full rounded-lg border border-sage-border px-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10"
              />
            </label>
            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-sage-secondary">টপিক</span>
              <input
                name="topic"
                placeholder="যেমন: গণিত"
                className="mt-2 h-11 w-full rounded-lg border border-sage-border px-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10"
              />
            </label>
            <label className="md:col-span-3">
              <span className="text-sm font-semibold text-sage-secondary">বিস্তারিত</span>
              <textarea
                name="details"
                rows={4}
                placeholder="ছাত্রদের জন্য সম্পূর্ণ নির্দেশনা লিখুন..."
                className="mt-2 w-full rounded-lg border border-sage-border px-3 py-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10"
              />
            </label>
          </div>
        </section>

        {state.message && (
          <p
            className={`rounded-lg px-4 py-3 text-sm font-semibold ${
              state.ok ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-sage-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-sage-secondary">
            <input type="checkbox" name="isPublished" defaultChecked className="h-4 w-4 accent-sage-primary" />
            এখনই প্রকাশ করুন
          </label>
          <button
            type="submit"
            disabled={pending || (classLevel !== "" && filteredBatches.length === 0)}
            className="rounded-lg bg-sage-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-sage-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "পাঠানো হচ্ছে..." : "নোটিশ পাঠান"}
          </button>
        </div>
      </div>
    </form>
  );
}


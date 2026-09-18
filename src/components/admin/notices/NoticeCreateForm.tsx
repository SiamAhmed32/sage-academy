"use client";

import { BellPlus, Users } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { createNoticeAction } from "@/app/admin/notices/actions";
import { adminClassLevelOptions } from "@/constants/admin-display";
import { formatAdminNumber } from "@/lib/admin-format";

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
        return { ok: true, message: "Notice sent successfully." };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : "The notice could not be saved.",
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
            <h2 className="text-xl font-bold text-sage-secondary">Send a New Notice</h2>
            <p className="mt-1 text-sm text-sage-gray-600">
              Choose a class and batch, then enter the notice details.
            </p>
          </div>
        </div>
      </div>
      )}

      <div className={embedded ? "space-y-6" : "space-y-6 p-5 sm:p-6"}>
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-sage-primary">1. Select recipients</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-sage-secondary">Class *</span>
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
                <option value="">Select a class</option>
                {adminClassLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-semibold text-sage-secondary">Batch *</span>
              <select
                name="batch"
                required
                value={batchId}
                disabled={!classLevel}
                onChange={(event) => setBatchId(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-sage-border bg-white px-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10 disabled:bg-sage-red-50/40"
              >
                <option value="">{classLevel ? "Select a batch" : "Select a class first"}</option>
                {filteredBatches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.batchCode || batch.title}
                    {batch.studentCount !== undefined ? ` · ${formatAdminNumber(batch.studentCount)} students` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedBatch && (
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <Users className="h-4 w-4 shrink-0" />
              <span>
                <strong>{formatAdminNumber(selectedBatch.studentCount ?? 0)}</strong> enrolled students in{" "}
                <strong>{selectedBatch.batchCode || selectedBatch.title}</strong> will see this notice.
              </span>
            </p>
          )}
          {classLevel && !filteredBatches.length && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This class has no active batches.
            </p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-sage-primary">2. Notice details</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-sage-secondary">Title *</span>
              <input
                name="title"
                required
                placeholder="For example: Weekly exam notice"
                className="mt-2 h-11 w-full rounded-lg border border-sage-border px-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10"
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-sage-secondary">Type</span>
              <select
                name="type"
                className="mt-2 h-11 w-full rounded-lg border border-sage-border px-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10"
              >
                <option value="general">General</option>
                <option value="exam">Exam / Quiz</option>
                <option value="payment">Payment</option>
              </select>
            </label>
            <label>
              <span className="text-sm font-semibold text-sage-secondary">Exam date</span>
              <input
                name="examDate"
                type="date"
                className="mt-2 h-11 w-full rounded-lg border border-sage-border px-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10"
              />
            </label>
            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-sage-secondary">Topic</span>
              <input
                name="topic"
                placeholder="For example: Mathematics"
                className="mt-2 h-11 w-full rounded-lg border border-sage-border px-3 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10"
              />
            </label>
            <label className="md:col-span-3">
              <span className="text-sm font-semibold text-sage-secondary">Details</span>
              <textarea
                name="details"
                rows={4}
                placeholder="Write complete instructions for students..."
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
            Publish now
          </label>
          <button
            type="submit"
            disabled={pending || (classLevel !== "" && filteredBatches.length === 0)}
            className="rounded-lg bg-sage-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-sage-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending..." : "Send notice"}
          </button>
        </div>
      </div>
    </form>
  );
}


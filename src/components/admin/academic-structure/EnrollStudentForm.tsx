"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";

import { enrollStudentAction } from "@/app/admin/actions/academic-structure";
import type { StudentRow, SubjectBatchRow } from "@/components/admin/academic-structure/types";
import { formatAdminCurrency } from "@/lib/admin-format";

export function EnrollStudentForm({
  students,
  slots,
  seatMap,
}: {
  students: StudentRow[];
  slots: SubjectBatchRow[];
  seatMap: Record<string, number>;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string[] | null>(null);

  function handleSubmit(formData: FormData) {
    setFeedback(null);
    startTransition(async () => {
      const result = await enrollStudentAction(formData);
      if (!result.success) {
        toast.error(result.message || "Enrollment failed.");
        return;
      }
      setFeedback(result.details ?? []);
      toast.success("Enrollment processed.");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6 rounded-xl border border-sage-border bg-white p-6">
      <div className="grid gap-1">
        <label className="text-xs font-bold text-sage-secondary">Student</label>
        <select name="studentId" required className="h-11 w-full max-w-md rounded-lg border border-sage-border px-3 text-sm">
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.nameEnglish} — {s.studentId}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-bold text-sage-secondary">Subject batch slots</label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((s) => {
            const used = seatMap[s._id] ?? 0;
            const full = used >= s.maxSeats;
            return (
              <label
                key={s._id}
                className="flex items-start gap-2 rounded-lg border border-sage-border p-3 text-sm hover:bg-sage-red-50/30"
              >
                <input type="checkbox" name="subjectBatchIds" value={s._id} className="mt-1 accent-sage-primary" />
                <span>
                  <span className="block font-bold text-sage-secondary">
                    {s.subjectId?.name} — {s.batchGroupId?.name}
                  </span>
                  <span className={`block text-xs ${full ? "text-red-600 font-bold" : "text-sage-gray-500"}`}>
                    {formatAdminCurrency(s.monthlyFee)} · {used}/{s.maxSeats} seats {full && "(full — will roll over)"}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-lg bg-sage-primary px-6 text-sm font-bold text-white disabled:opacity-50"
      >
        {isPending ? "Enrolling…" : "Enroll"}
      </button>

      {feedback && feedback.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-sage-red-50/40 p-4 text-sm text-sage-secondary">
          {feedback.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>
      )}
    </form>
  );
}

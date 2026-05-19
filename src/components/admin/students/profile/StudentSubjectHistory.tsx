import { History } from "lucide-react";

import type { StudentProfile } from "./types";

const actionLabels = {
  added: "Added",
  removed: "Removed",
  updated: "Fee updated",
};

export function StudentSubjectHistory({ student }: { student: StudentProfile }) {
  const history = [...(student.subjectHistory || [])].reverse();

  return (
    <section className="rounded-xl border border-sage-border bg-white shadow-sm">
      <div className="border-b border-sage-border bg-sage-red-50/40 p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-sage-secondary">
          <History className="h-5 w-5 text-sage-primary" />
          Subject Change History
        </h3>
        <p className="mt-1 text-sm text-sage-gray-500">
          Month-wise academic changes used for billing decisions.
        </p>
      </div>
      <div className="divide-y divide-sage-border">
        {history.length ? history.map((item, index) => (
          <div key={`${item.subjectName}-${item.effectiveMonth}-${item.effectiveYear}-${index}`} className="grid gap-3 p-4 md:grid-cols-[160px_1fr_auto]">
            <div>
              <span className="rounded-full bg-sage-red-50 px-3 py-1 text-xs font-bold text-sage-primary">
                {actionLabels[item.action]}
              </span>
              <p className="mt-2 text-xs text-sage-gray-500">{item.effectiveMonth} {item.effectiveYear}</p>
            </div>
            <div>
              <p className="font-bold text-sage-secondary">{item.subjectName}</p>
              {item.note && <p className="mt-1 text-sm text-sage-gray-500">{item.note}</p>}
            </div>
            <div className="text-right text-sm font-bold text-sage-secondary">
              ৳{item.monthlyFee || 0}
            </div>
          </div>
        )) : (
          <p className="p-6 text-center text-sm text-sage-gray-500">No subject changes have been recorded yet.</p>
        )}
      </div>
    </section>
  );
}

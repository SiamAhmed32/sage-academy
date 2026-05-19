"use client";

import { Clock } from "lucide-react";
import { useMemo, useState } from "react";
import {
  finalSubjectFee,
  makeSubjectSelection,
  type BatchSubjectFee,
  type SavedSubjectFee,
  type SubjectFeeSelection,
} from "./student-subject-fees";

export function StudentSubjectFeeSelector({
  subjects,
  savedSubjects = [],
}: {
  subjects: BatchSubjectFee[];
  savedSubjects?: SavedSubjectFee[];
}) {
  const savedMap = useMemo(
    () => new Map(savedSubjects.map((s) => [s.subjectName, s])),
    [savedSubjects]
  );
  const [selected, setSelected] = useState<Record<string, SubjectFeeSelection>>(() =>
    Object.fromEntries(
      subjects
        .filter((subject) => savedMap.has(subject.subjectName))
        .map((subject) => [subject.subjectName, makeSubjectSelection(subject, savedMap.get(subject.subjectName))])
    )
  );

  function toggle(subject: BatchSubjectFee) {
    setSelected((current) => {
      const next = { ...current };
      if (next[subject.subjectName]) delete next[subject.subjectName];
      else next[subject.subjectName] = makeSubjectSelection(subject);
      return next;
    });
  }

  function update(name: string, patch: Partial<SubjectFeeSelection>) {
    setSelected((current) => {
      const item = { ...current[name], ...patch };
      item.monthlyFee = finalSubjectFee(item.baseFee, item.discountType, item.discountValue || 0);
      return { ...current, [name]: item };
    });
  }

  const rows = Object.values(selected);
  const total = rows.reduce((sum, item) => sum + item.monthlyFee, 0);

  return (
    <div>
      <input type="hidden" name="selectedSubjectsJson" value={JSON.stringify(rows)} />
      <div className="mb-3 flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-widest text-sage-primary">বিষয়সমূহ নির্বাচন</label>
        <span className="text-xs font-bold text-sage-secondary">মোট: ৳{total}</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {subjects.map((subject) => {
          const item = selected[subject.subjectName];
          return (
            <div key={subject.subjectName} className={`rounded-xl border p-3 ${item ? "border-sage-primary bg-sage-primary/5" : "border-sage-border bg-white"}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={!!item} onChange={() => toggle(subject)} className="mt-1 h-4 w-4 accent-sage-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sage-secondary">{subject.subjectName}</span>
                  <span className="mt-1 flex items-center gap-1 text-[10px] font-black text-sage-primary">
                    <Clock size={10} /> {subject.startTime} - {subject.endTime}
                  </span>
                  <span className="block text-[10px] text-sage-gray-500">{subject.days?.join(", ")}</span>
                </span>
                <span className="text-xs font-black text-sage-primary">৳{subject.monthlyFee}</span>
              </label>
              {item && (
                <div className="mt-3 grid gap-2 border-t border-sage-border pt-3 sm:grid-cols-4">
                  <select value={item.discountType} onChange={(e) => update(item.subjectName, { discountType: e.target.value as SubjectFeeSelection["discountType"], discountValue: 0 })} className="h-9 rounded-lg border border-sage-border bg-white px-2 text-xs">
                    <option value="none">No discount</option>
                    <option value="amount">৳ Discount</option>
                    <option value="percent">% Discount</option>
                    <option value="custom">Custom fee</option>
                  </select>
                  <input type="number" min="0" value={item.discountValue || ""} onChange={(e) => update(item.subjectName, { discountValue: Number(e.target.value) || 0 })} disabled={item.discountType === "none"} placeholder="Value" className="h-9 rounded-lg border border-sage-border px-2 text-xs disabled:bg-sage-red-50" />
                  <input value={item.discountNote} onChange={(e) => update(item.subjectName, { discountNote: e.target.value })} placeholder="Note" className="h-9 rounded-lg border border-sage-border px-2 text-xs" />
                  <div className="flex h-9 items-center justify-center rounded-lg bg-white px-2 text-center text-xs font-bold text-sage-secondary ring-1 ring-sage-border">
                    Final ৳{item.monthlyFee}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

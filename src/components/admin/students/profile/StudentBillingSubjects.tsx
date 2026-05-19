import { BookOpen, CreditCard } from "lucide-react";

import type { StudentProfile } from "./types";
import { discountText, subjectTotal } from "./student-profile-utils";

export function StudentBillingSubjects({ student }: { student: StudentProfile }) {
  const subjects = student.selectedSubjects ?? [];

  return (
    <section className="rounded-xl border border-sage-border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-sage-border bg-sage-red-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-sage-secondary">
            <CreditCard className="h-5 w-5 text-sage-primary" />
            Billing & Enrolled Subjects
          </h3>
          <p className="mt-1 text-sm text-sage-gray-500">
            Batch fee, discount, and final monthly fee for this student.
          </p>
        </div>
        <div className="rounded-full bg-sage-primary px-4 py-2 text-sm font-black text-white">
          Monthly ৳{subjectTotal(subjects)}
        </div>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-2">
        {subjects.length ? (
          subjects.map((subject) => (
            <div key={subject.subjectName} className="rounded-xl border border-sage-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="font-bold text-sage-secondary">{subject.subjectName}</h4>
                    <p className="mt-1 text-xs text-sage-gray-500">{discountText(subject)}</p>
                  </div>
                </div>
                <span className="rounded-full bg-sage-red-50 px-3 py-1 text-xs font-black text-sage-primary ring-1 ring-sage-red-100">
                  ৳{subject.monthlyFee}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <p className="rounded-lg bg-sage-red-50/40 p-2">Batch ৳{subject.baseFee ?? subject.monthlyFee}</p>
                <p className="rounded-lg bg-sage-red-50/40 p-2">{discountText(subject)}</p>
                <p className="rounded-lg bg-sage-red-50/40 p-2 font-bold">Final ৳{subject.monthlyFee}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-sage-border p-6 text-center text-sm text-sage-gray-500 lg:col-span-2">
            No subjects selected.
          </p>
        )}
      </div>
    </section>
  );
}

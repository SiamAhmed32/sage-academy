import { getClassLabel } from "@/constants/class-levels";

import type { StudentProfile } from "./types";

const dash = "N/A";

export function StudentQuickFacts({ student }: { student: StudentProfile }) {
  const facts = [
    ["শ্রেণি", student.classLevel ? getClassLabel(student.classLevel) : dash],
    ["Batch", student.batch?.title || dash],
    ["School/College", student.schoolName || dash],
    ["Section", student.section || dash],
    ["Roll", student.roll || dash],
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {facts.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-sage-border bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-sage-gray-500">
            {label}
          </p>
          <p className="mt-2 truncate text-lg font-black text-sage-secondary">
            {value}
          </p>
        </div>
      ))}
    </section>
  );
}

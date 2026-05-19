import { GraduationCap, Users } from "lucide-react";

import { toBanglaDigits } from "@/constants/class-levels";
import type { RoutineClass } from "@/lib/admin-routine";

export function RoutineClassCard({ item }: { item: RoutineClass }) {
  return (
    <article className="grid gap-4 rounded-xl border border-sage-border bg-white p-4 shadow-sm lg:grid-cols-[150px_1fr_170px] lg:items-center">
      <div className="rounded-xl bg-sage-red-50 px-4 py-3 text-sage-primary">
        <p className="text-xs font-bold uppercase text-sage-gray-500">সময়</p>
        <p className="mt-1 text-lg font-black">{item.startTime || "নেই"}</p>
        <p className="text-sm font-bold text-sage-secondary">
          শেষ: {item.endTime || "নেই"}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-sage-secondary">{item.subjectName}</h3>
          {item.classLevel ? (
            <span className="rounded-full bg-sage-red-50 px-2 py-0.5 text-xs font-bold text-sage-primary">
              ক্লাস {toBanglaDigits(item.classLevel)}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-sage-gray-700">
          {item.batchTitle}
        </p>
        <p className="mt-1 text-xs text-sage-gray-500">
          {item.batchCode || "কোড নেই"} · {item.status || "স্ট্যাটাস নেই"}
        </p>
        {item.routineNote ? (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-sage-gray-500">
            {item.routineNote}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2 rounded-xl bg-sage-red-50/40 p-3 text-sm text-sage-gray-600">
        <p className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-sage-primary" />
          {item.teacherName}
        </p>
        <p className="flex items-center gap-2">
          <Users className="h-4 w-4 text-sage-primary" />
          খালি/মোট সিট: {item.seats}
        </p>
      </div>
    </article>
  );
}

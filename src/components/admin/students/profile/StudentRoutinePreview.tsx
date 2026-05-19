import { CalendarDays, Clock, Users } from "lucide-react";

import { toBanglaDigits } from "@/constants/class-levels";
import type { RoutineItem } from "./types";

export function StudentRoutinePreview({ routine }: { routine: RoutineItem[] }) {
  const preview = routine.slice(0, 6);

  return (
    <section className="overflow-hidden rounded-2xl border border-sage-border bg-white shadow-sm">
      <div className="grid gap-3 border-b border-sage-border bg-sage-red-50/40 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-sage-secondary">
            <CalendarDays className="h-5 w-5 text-sage-primary" />
            Class routine
          </h3>
          <p className="mt-1 text-sm text-sage-gray-500">
            Upcoming class times from this student&apos;s selected subjects.
          </p>
        </div>
        <div className="rounded-xl border border-sage-border bg-white px-4 py-3 text-sm font-bold text-sage-secondary">
          {toBanglaDigits(routine.length)} scheduled class{routine.length === 1 ? "" : "es"}
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-3">
        {preview.length ? (
          preview.map((item) => (
            <div
              key={`${item.day}-${item.subjectName}-${item.startTime}`}
              className="grid gap-3 rounded-xl border border-sage-border bg-white p-4 transition hover:border-sage-primary/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-sage-secondary">{item.subjectName}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-sage-gray-500">
                    <Users className="h-3.5 w-3.5 text-sage-primary" />
                    {item.teacherName}
                  </p>
                </div>
                <div className="shrink-0 rounded-lg bg-sage-red-50 px-3 py-2 text-sm font-bold text-sage-primary">
                  {item.dayBn}
                </div>
              </div>
              <p className="flex items-center gap-2 rounded-lg bg-sage-red-50/30 px-3 py-2 text-xs font-semibold text-sage-gray-600">
                <Clock className="h-3.5 w-3.5 text-sage-primary" />
                {item.startTime} - {item.endTime}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-sage-border p-8 text-center text-sm text-sage-gray-500 md:col-span-2 2xl:col-span-3">
            No routine found for selected subjects.
          </p>
        )}
      </div>

      {routine.length > 6 && (
        <details className="border-t border-sage-border p-4">
          <summary className="cursor-pointer text-sm font-bold text-sage-primary">
            View full weekly routine ({toBanglaDigits(routine.length)})
          </summary>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {routine.slice(6).map((item) => (
              <p
                key={`${item.day}-${item.subjectName}-${item.startTime}`}
                className="rounded-lg bg-sage-red-50/40 p-3 text-sm text-sage-secondary"
              >
                {item.dayBn}: {item.subjectName} · {item.startTime} - {item.endTime}
              </p>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

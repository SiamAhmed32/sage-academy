import { GraduationCap, Users } from "lucide-react";

import { getAdminClassLabel } from "@/constants/admin-display";
import { formatAdminNumber } from "@/lib/admin-format";
import type { RoutineClass } from "@/lib/admin-routine";

const statusLabels: Record<string, string> = {
  "ভর্তি চলছে": "Admission open", // admin-language-allow: persisted enum value
  "শীঘ্রই শুরু": "Starting soon", // admin-language-allow: persisted enum value
  "ভর্তি বন্ধ": "Admission closed", // admin-language-allow: persisted enum value
};

export function RoutineClassCard({ item }: { item: RoutineClass }) {
  return (
    <article className="grid gap-4 rounded-xl border border-sage-border bg-white p-4 shadow-sm lg:grid-cols-[150px_1fr_170px] lg:items-center">
      <div className="rounded-xl bg-sage-red-50 px-4 py-3 text-sage-primary">
        <p className="text-xs font-bold uppercase text-sage-gray-500">Time</p>
        <p className="mt-1 text-lg font-black">{item.startTime || "Not set"}</p>
        <p className="text-sm font-bold text-sage-secondary">
          Ends: {item.endTime || "Not set"}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-sage-secondary">{item.subjectName}</h3>
          {item.classLevel ? (
            <span className="rounded-full bg-sage-red-50 px-2 py-0.5 text-xs font-bold text-sage-primary">
              {getAdminClassLabel(item.classLevel)}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-sage-gray-700">
          {item.batchTitle}
        </p>
        <p className="mt-1 text-xs text-sage-gray-500">
          {item.batchCode || "No code"} · {statusLabels[item.status] || item.status || "No status"}
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
          Available/total seats: {formatAdminNumber(item.availableSeats)} /{" "}
          {formatAdminNumber(item.totalSeats)}
        </p>
      </div>
    </article>
  );
}

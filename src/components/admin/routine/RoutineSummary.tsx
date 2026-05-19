import { BookOpen, CalendarDays, Clock } from "lucide-react";

import type { RoutineClass, RoutineDay } from "@/lib/admin-routine";

function uniqueCount(values: string[]) {
  return new Set(values.filter(Boolean)).size;
}

export function RoutineSummary({
  day,
  classes,
}: {
  day: RoutineDay;
  classes: RoutineClass[];
}) {
  const batches = uniqueCount(classes.map((item) => item.batchCode || item.batchTitle));
  const first = classes[0]?.startTime || "নেই";
  const last = classes.at(-1)?.endTime || "নেই";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-sage-border bg-white p-4 shadow-sm">
        <CalendarDays className="mb-3 h-5 w-5 text-sage-primary" />
        <p className="text-sm font-bold text-sage-gray-600">নির্বাচিত দিন</p>
        <p className="mt-1 text-2xl font-black text-sage-secondary">{day}</p>
      </div>
      <div className="rounded-xl border border-sage-border bg-white p-4 shadow-sm">
        <BookOpen className="mb-3 h-5 w-5 text-sage-primary" />
        <p className="text-sm font-bold text-sage-gray-600">ক্লাস / ব্যাচ</p>
        <p className="mt-1 text-2xl font-black text-sage-secondary">
          {classes.length} / {batches}
        </p>
      </div>
      <div className="rounded-xl border border-sage-border bg-white p-4 shadow-sm">
        <Clock className="mb-3 h-5 w-5 text-sage-primary" />
        <p className="text-sm font-bold text-sage-gray-600">সময় সীমা</p>
        <p className="mt-1 text-2xl font-black text-sage-secondary">
          {first} - {last}
        </p>
      </div>
    </div>
  );
}

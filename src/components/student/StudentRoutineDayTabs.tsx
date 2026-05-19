import Link from "next/link";

import { studentDays } from "@/lib/student-dashboard";
import { cn } from "@/lib/utils";

export function StudentRoutineDayTabs({ selectedDayBn }: { selectedDayBn: string }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-sage-red-50 p-1 ring-1 ring-sage-red-100">
      <div className="flex min-w-max gap-1">
        {studentDays.map((day) => (
          <Link
            key={day.bn}
            href={`/student/routine?day=${encodeURIComponent(day.bn)}`}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-bold transition",
              selectedDayBn === day.bn
                ? "bg-white text-sage-primary shadow-sm"
                : "text-sage-gray-600 hover:text-sage-secondary"
            )}
          >
            {day.bn}
          </Link>
        ))}
      </div>
    </div>
  );
}

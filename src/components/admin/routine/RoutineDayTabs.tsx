import Link from "next/link";

import { ROUTINE_DAYS, type RoutineDay } from "@/lib/admin-routine";
import { cn } from "@/lib/utils";

export function RoutineDayTabs({ selectedDay }: { selectedDay: RoutineDay }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-sage-red-50 p-1 ring-1 ring-sage-red-100">
      <div className="flex min-w-max gap-1">
        {ROUTINE_DAYS.map((day) => (
          <Link
            key={day}
            href={`/admin/routine?day=${encodeURIComponent(day)}`}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-bold transition",
              selectedDay === day
                ? "bg-white text-sage-primary shadow-sm"
                : "text-sage-gray-600 hover:text-sage-secondary"
            )}
          >
            {day}
          </Link>
        ))}
      </div>
    </div>
  );
}

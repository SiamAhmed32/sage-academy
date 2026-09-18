import { BookOpen } from "lucide-react";

import type { RoutineClass } from "@/lib/admin-routine";
import { RoutineClassCard } from "./RoutineClassCard";

export function RoutineTimeline({ classes }: { classes: RoutineClass[] }) {
  if (!classes.length) {
    return (
      <div className="rounded-xl border border-dashed border-sage-border bg-white px-4 py-12 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-sage-gray-300" />
        <h3 className="font-bold text-sage-secondary">No classes on this day</h3>
        <p className="mt-1 text-sm text-sage-gray-500">
          Add subject schedules in Batch Management to show them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {classes.map((item) => (
        <RoutineClassCard key={item.id} item={item} />
      ))}
    </div>
  );
}

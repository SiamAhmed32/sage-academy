import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RoutineDayTabs } from "@/components/admin/routine/RoutineDayTabs";
import { RoutineSummary } from "@/components/admin/routine/RoutineSummary";
import { RoutineTimeline } from "@/components/admin/routine/RoutineTimeline";
import { getRoutineClasses, getRoutineDay } from "@/lib/admin-routine";

type PageProps = {
  searchParams: Promise<{ day?: string }>;
};

export default async function AdminRoutinePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedDay = getRoutineDay(params.day);
  const classes = await getRoutineClasses(selectedDay);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Class Schedule"
        description="View daily classes from academic batch schedules, including time, batch, subject, teacher, and seat availability."
      />

      <RoutineDayTabs selectedDay={selectedDay} />
      <RoutineSummary day={selectedDay} classes={classes} />
      <RoutineTimeline classes={classes} />
    </div>
  );
}

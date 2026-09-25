import { TimetableView } from "@/components/admin/academy/TimetableView";
import { MiniStat, MiniStats, PageHeading } from "@/components/admin/sa/ui";
import { WEEK_DAYS, WEEK_DAY_LABELS, type WeekDay } from "@/lib/academy/constants";
import { dhakaParts } from "@/lib/academy/codes";
import { allActiveSlots, listBatchOptions, listTeacherOptions } from "@/lib/academy/queries";

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ batch?: string; teacher?: string }> }) {
  const params = await searchParams;
  const [slots, batches, allTeachers] = await Promise.all([allActiveSlots(), listBatchOptions(), listTeacherOptions()]);
  const teachers = new Map<string, string>();
  for (const slot of slots) if (slot.teacherId) teachers.set(slot.teacherId, slot.teacherName);
  const today = dhakaParts().weekday;
  const [hours, minutes] = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: false })
    .format(new Date())
    .split(":")
    .map(Number);
  const nowMinutes = hours * 60 + minutes;
  const todayCount = slots.filter((slot) => slot.day === today).length;
  const busiest = WEEK_DAYS.map((day) => ({ day, count: slots.filter((slot) => slot.day === day).length })).sort(
    (a, b) => b.count - a.count
  )[0];

  return (
    <div>
      <PageHeading
        eyebrow="Academics"
        title="Class routine"
        description="Every batch's weekly classes, Saturday to Thursday. Pick a batch, teacher or room to see just theirs. Click a class to open that batch's routine and change it."
      />
      <MiniStats>
        <MiniStat label="Classes this week" value={slots.length} note={`Across ${batches.filter((batch) => batch.routine.length).length} batches`} />
        <MiniStat label="Classes today" value={today === "fri" ? "Off day" : todayCount} note={today === "fri" ? "Friday — no classes" : "From the routine"} />
        <MiniStat label="Teachers teaching" value={teachers.size} note="With at least one class" />
        <MiniStat
          label="Busiest day"
          value={busiest && busiest.count > 0 ? WEEK_DAY_LABELS[busiest.day] : "—"}
          note={busiest && busiest.count > 0 ? `${busiest.count} classes` : "No classes yet"}
        />
      </MiniStats>
      <TimetableView
        slots={slots}
        batches={batches.map((batch) => ({ id: batch.id, code: batch.code }))}
        teachers={allTeachers.map((teacher) => ({ id: teacher.id, name: teacher.name }))}
        initialBatch={params.batch ?? ""}
        initialTeacher={params.teacher ?? ""}
        today={today as WeekDay | "fri"}
        nowMinutes={nowMinutes}
      />
    </div>
  );
}

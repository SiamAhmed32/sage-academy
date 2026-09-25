import { PortalRoutine, type PortalSlot } from "@/components/student/portal/PortalRoutine";
import { MiniStat, MiniStats, PageHeading } from "@/components/admin/sa/ui";
import type { WeekDay } from "@/lib/academy/constants";
import { dhakaNowMinutes, dhakaParts } from "@/lib/academy/codes";
import { BN_DAYS } from "@/lib/academy/bn";
import { getPortalStudent } from "@/lib/academy/portal";

export default async function StudentRoutinePage() {
  const { detail } = await getPortalStudent();
  if (!detail) return null;
  const slots = detail.routine as PortalSlot[];
  const today = dhakaParts().weekday as WeekDay | "fri";
  const batches = [...new Set(slots.map((slot) => slot.batchCode))];
  const busiest = Object.entries(
    slots.reduce<Record<string, number>>((acc, slot) => ({ ...acc, [slot.day]: (acc[slot.day] ?? 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <PageHeading
        eyebrow="Student workspace"
        title="ক্লাস রুটিন"
        description={`${detail.student.name} · ${detail.student.className} · ${batches.join(", ") || detail.student.homeBatchCode}`}
      />
      <MiniStats>
        <MiniStat label="সপ্তাহে ক্লাস" value={slots.length} note="শনি থেকে বৃহস্পতি" />
        <MiniStat label="আজ" value={today === "fri" ? "ছুটি" : slots.filter((slot) => slot.day === today).length} note={BN_DAYS[today]} />
        <MiniStat label="বিষয়" value={detail.subjects.filter((row) => row.status === "active").length} note="চলমান বিষয়" />
        <MiniStat label="ব্যস্ত দিন" value={busiest ? BN_DAYS[busiest[0] as WeekDay] : "—"} note={busiest ? `${busiest[1]}টি ক্লাস` : "রুটিন নেই"} />
      </MiniStats>
      <PortalRoutine slots={slots} today={today} nowMinutes={dhakaNowMinutes()} exportName={`${detail.student.studentId}-routine`} />
    </div>
  );
}

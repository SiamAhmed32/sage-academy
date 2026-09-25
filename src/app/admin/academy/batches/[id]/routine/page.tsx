import { notFound } from "next/navigation";

import { RoutineEditor } from "@/components/admin/academy/RoutineEditor";
import { PageHeading } from "@/components/admin/sa/ui";
import { BATCH_GENDER_LABELS, VERSION_LABELS } from "@/lib/academy/constants";
import { allActiveSlots, getBatchDetail } from "@/lib/academy/queries";

/** One batch's weekly class routine, edited on the week grid. */
export default async function BatchRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [batch, otherSlots] = await Promise.all([getBatchDetail(id), allActiveSlots()]);
  if (!batch) notFound();
  const label = `${batch.className} · ${BATCH_GENDER_LABELS[batch.gender]} · ${VERSION_LABELS[batch.version]}`;

  return (
    <div>
      <PageHeading
        eyebrow="Class routine"
        title={`${batch.code} routine`}
        description={`${label}. Click an empty cell to add a class, click a class to change or remove it, then save. Room and teacher clashes with other batches show in red.`}
        back={{ href: "/admin/academy/batches", label: "All batches" }}
      />
      <RoutineEditor
        batch={{
          id: batch.id,
          code: batch.code,
          label,
          year: batch.year,
          classId: batch.classId,
          gender: batch.gender,
          version: batch.version,
          capacity: batch.capacity,
          note: batch.note,
          subjects: batch.subjects.map((subject) => ({
            subjectId: subject.subjectId,
            name: subject.name,
            teacherId: subject.teacherId,
            teacherName: subject.teacherName,
          })),
          routine: batch.routine,
        }}
        otherSlots={otherSlots.map((slot) => ({ ...slot, teacherId: slot.teacherId || null }))}
      />
    </div>
  );
}

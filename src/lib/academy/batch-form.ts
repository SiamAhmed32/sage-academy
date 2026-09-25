import type { BatchFormData } from "@/components/admin/academy/BatchDrawer";
import { dhakaParts, formatBatchCode } from "@/lib/academy/codes";
import { peekBatchSequence } from "@/lib/academy/batch-sequence";
import { allActiveSlots, listClassOptions, listSubjectOptions, listTeacherOptions } from "@/lib/academy/queries";

/** Everything the batch drawer and routine page need. */
export async function loadBatchFormData(): Promise<BatchFormData> {
  const [classes, subjects, teachers, otherSlots] = await Promise.all([
    listClassOptions(),
    listSubjectOptions(),
    listTeacherOptions(),
    allActiveSlots(),
  ]);
  const { year } = dhakaParts();
  // Preview for the form's default choice (first class, boys, Bangla); it updates as the admin changes them.
  const first = classes[0];
  const initialPreview = first
    ? await (async () => {
        const key = { classId: first.id, classLevel: first.level, gender: "boys" as const, version: "bangla" as const };
        const sequence = await peekBatchSequence(key);
        return { code: formatBatchCode({ ...key, sequence }), sequence };
      })()
    : null;

  return {
    classes,
    subjects,
    teachers,
    // Batches carry over year to year; the year is only recorded as when the batch was created.
    years: [year],
    otherSlots: otherSlots.map((slot) => ({ ...slot, teacherId: slot.teacherId || null })),
    initialPreview,
  };
}

import Student from "@/models/Student";

/** Normalize school/college name for comparison (trim, lowercase, collapse spaces). */
export function normalizeSchoolKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Normalize roll for comparison (trim only). */
export function normalizeRollKey(roll: string): string {
  return roll.trim();
}

export const DUPLICATE_STUDENT_MESSAGE =
  "একই শ্রেণি, স্কুল/কলেজ ও রোলের জন্য ইতিমধ্যে একজন সক্রিয় শিক্ষার্থী আছে। ডুপ্লিকেট তৈরি করা হয়নি।";

/**
 * Same class + school/college + roll as another active student ⇒ duplicate.
 * Empty school or roll skips the check (no duplicate rule applied).
 */
export async function findActiveDuplicateStudent(params: {
  classLevel: number;
  schoolName: string;
  roll: string;
  excludeStudentId?: string;
}) {
  const schoolKey = normalizeSchoolKey(params.schoolName);
  const rollKey = normalizeRollKey(params.roll);

  if (!schoolKey || !rollKey) return null;

  const query: Record<string, unknown> = {
    classLevel: params.classLevel,
    isActive: true,
  };
  if (params.excludeStudentId) {
    query._id = { $ne: params.excludeStudentId };
  }

  const candidates = await Student.find(query)
    .select("_id studentId nameEnglish schoolName roll")
    .lean();

  for (const c of candidates) {
    const sn = normalizeSchoolKey(String(c.schoolName ?? ""));
    const rn = normalizeRollKey(String(c.roll ?? ""));
    if (sn === schoolKey && rn === rollKey) {
      return {
        studentId: String(c.studentId ?? ""),
        nameEnglish: String(c.nameEnglish ?? ""),
      };
    }
  }

  return null;
}

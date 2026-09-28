import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { allActiveSlots, listBatchOptions, listTeacherOptions } from "@/lib/academy/queries";
import { AppError } from "@/lib/errors";
import { requireRole, staffRoles } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const loadTimetable = unstable_cache(
  async () => {
    const [slots, batches, teachers] = await Promise.all([allActiveSlots(), listBatchOptions(), listTeacherOptions()]);
    return {
      slots,
      batches: batches.map((batch) => ({ id: batch.id, code: batch.code, classCount: batch.routine.length })),
      teachers: teachers.map((teacher) => ({ id: teacher.id, name: teacher.name })),
    };
  },
  ["admin-timetable"],
  { revalidate: 20 }
);

export async function GET() {
  try {
    await requireRole(staffRoles);
    return NextResponse.json(await loadTimetable());
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    console.error("[admin-timetable]", error);
    return NextResponse.json({ message: "Could not load the class routine." }, { status: 500 });
  }
}

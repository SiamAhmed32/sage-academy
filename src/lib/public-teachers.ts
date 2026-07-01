import { unstable_cache } from "next/cache";

import { connectDB } from "@/lib/mongodb";
import Teacher from "@/models/Teacher";
import type { Teacher as TeacherType } from "@/types/teacher";

export const PUBLIC_TEACHERS_CACHE_TAG = "public-teachers";

const publicTeacherFields =
  "name subject designation experience quote image isFeatured order createdAt updatedAt";

async function fetchPublicTeachers() {
  await connectDB();

  const teachers = await Teacher.find()
    .select(publicTeacherFields)
    .sort({ isFeatured: -1, order: 1, createdAt: 1 })
    .lean();

  return teachers.map((teacher) => ({
    ...teacher,
    _id: String(teacher._id),
    createdAt: teacher.createdAt?.toISOString?.() ?? String(teacher.createdAt),
    updatedAt: teacher.updatedAt?.toISOString?.() ?? String(teacher.updatedAt),
  })) as TeacherType[];
}

export const getPublicTeachers = unstable_cache(fetchPublicTeachers, ["public-teachers"], {
  revalidate: 60,
  tags: [PUBLIC_TEACHERS_CACHE_TAG],
});

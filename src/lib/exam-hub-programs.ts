import { cache } from "react";
import { unstable_cache } from "next/cache";

import { serializePublicProgram } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";

export const EXAM_PROGRAMS_CACHE_TAG = "exam-programs";

async function fetchPublishedExamPrograms(limit?: number) {
  await connectDB();

  let query = ExamProgram.find({ status: "published" }).sort({
    featured: -1,
    order: 1,
    startDate: 1,
  });

  if (limit) {
    query = query.limit(limit);
  }

  const programs = await query.lean();
  return programs.map((program) =>
    serializePublicProgram(program as Record<string, unknown>)
  );
}

export const getPublishedExamPrograms = unstable_cache(
  () => fetchPublishedExamPrograms(),
  ["published-exam-programs"],
  { revalidate: 60, tags: [EXAM_PROGRAMS_CACHE_TAG] }
);

export const getHomeExamPrograms = unstable_cache(
  () => fetchPublishedExamPrograms(4),
  ["home-exam-programs"],
  { revalidate: 60, tags: [EXAM_PROGRAMS_CACHE_TAG] }
);

export const getPublishedExamProgramBySlug = cache(async (slug: string) => {
  await connectDB();
  return ExamProgram.findOne({ slug, status: "published" }).lean();
});

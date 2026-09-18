import { NextRequest } from "next/server";

import {
  paginationMeta,
  parseExamEnrollmentListQuery,
} from "@/lib/admin/exam-hub-list-query";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import ExamEnrollment from "@/models/ExamEnrollment";
import ExamProgram from "@/models/ExamProgram";

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const { filter, mongoSort, page, limit } = parseExamEnrollmentListQuery(
    req.nextUrl.searchParams
  );
  const skip = (page - 1) * limit;
  const [enrollments, total] = await Promise.all([
    ExamEnrollment.find(filter).sort(mongoSort).skip(skip).limit(limit).lean(),
    ExamEnrollment.countDocuments(filter),
  ]);
  const programIds = [...new Set(enrollments.map((e) => String(e.programId)))];
  const programs = await ExamProgram.find({ _id: { $in: programIds } }).select("title slug").lean();
  const programMap = new Map(programs.map((p) => [String(p._id), p]));

  const items = enrollments.map((e) => ({
    ...e,
    _id: String(e._id),
    programId: String(e.programId),
    programTitle: programMap.get(String(e.programId))?.title || "Deleted exam program",
    programSlug: programMap.get(String(e.programId))?.slug || "",
  }));

  return successResponse(
    { items, ...paginationMeta(total, page, limit) },
    "Exam enrollments loaded successfully."
  );
});

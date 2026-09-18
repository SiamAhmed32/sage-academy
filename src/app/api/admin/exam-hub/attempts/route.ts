import { NextRequest } from "next/server";

import {
  paginationMeta,
  parseExamAttemptListQuery,
} from "@/lib/admin/exam-hub-list-query";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import ExamAttempt from "@/models/ExamAttempt";
import ExamProgram from "@/models/ExamProgram";

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const { filter, mongoSort, page, limit } = parseExamAttemptListQuery(
    req.nextUrl.searchParams
  );
  const skip = (page - 1) * limit;
  const [attempts, total] = await Promise.all([
    ExamAttempt.find(filter).sort(mongoSort).skip(skip).limit(limit).lean(),
    ExamAttempt.countDocuments(filter),
  ]);

  const programIds = [...new Set(attempts.map((a) => String(a.programId)))];
  const programs = await ExamProgram.find({ _id: { $in: programIds } }).select("title slug").lean();
  const programMap = new Map(programs.map((p) => [String(p._id), p]));

  const items = attempts.map((attempt) => ({
    _id: String(attempt._id),
    programId: String(attempt.programId),
    programTitle: programMap.get(String(attempt.programId))?.title || "Deleted exam program",
    programSlug: programMap.get(String(attempt.programId))?.slug || "",
    name: attempt.name,
    phone: attempt.phone,
    status: attempt.status,
    score: attempt.score,
      totalMarks: attempt.totalMarks,
    durationSeconds: attempt.durationSeconds,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    submittedAt: attempt.submittedAt,
    ip: attempt.ip,
  }));

  return successResponse(
    { items, ...paginationMeta(total, page, limit) },
    "Exam attempts loaded successfully."
  );
});

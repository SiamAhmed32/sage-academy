import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import ExamAttempt from "@/models/ExamAttempt";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const programId = req.nextUrl.searchParams.get("programId");
  const status = req.nextUrl.searchParams.get("status");
  const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 100)));

  const filter: Record<string, unknown> = {};
  if (programId) filter.programId = programId;
  if (status) filter.status = status;

  const attempts = await ExamAttempt.find(filter)
    .sort({ submittedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  const programIds = [...new Set(attempts.map((a) => String(a.programId)))];
  const programs = await ExamProgram.find({ _id: { $in: programIds } }).select("title slug").lean();
  const programMap = new Map(programs.map((p) => [String(p._id), p]));

  return successResponse(
    attempts.map((attempt) => ({
      _id: String(attempt._id),
      programId: String(attempt.programId),
      programTitle: programMap.get(String(attempt.programId))?.title || "",
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
    })),
    "Attempts fetched"
  );
});

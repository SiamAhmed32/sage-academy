import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import ExamEnrollment from "@/models/ExamEnrollment";
import ExamProgram from "@/models/ExamProgram";

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const status = req.nextUrl.searchParams.get("status");
  const paymentStatus = req.nextUrl.searchParams.get("paymentStatus");
  const programId = req.nextUrl.searchParams.get("programId");

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (programId) filter.programId = programId;

  const enrollments = await ExamEnrollment.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  const programIds = [...new Set(enrollments.map((e) => String(e.programId)))];
  const programs = await ExamProgram.find({ _id: { $in: programIds } }).select("title slug").lean();
  const programMap = new Map(programs.map((p) => [String(p._id), p]));

  return successResponse(
    enrollments.map((e) => ({
      ...e,
      _id: String(e._id),
      programId: String(e.programId),
      programTitle: programMap.get(String(e.programId))?.title || "",
      programSlug: programMap.get(String(e.programId))?.slug || "",
    })),
    "Enrollments fetched"
  );
});

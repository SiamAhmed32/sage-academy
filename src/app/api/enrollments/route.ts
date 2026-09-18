import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { enrollStudentInSubjectBatches } from "@/lib/enrollment-service";
import { adminRoles, requireRole, staffRoles } from "@/lib/rbac";
import Enrollment from "@/models/Enrollment";
import { enrollStudentSchema } from "@/schemas/enrollment";

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(staffRoles);
  await connectDB();

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const subjectBatchId = searchParams.get("subjectBatchId");

  const query: Record<string, unknown> = {};
  if (studentId) query.studentId = studentId;
  if (subjectBatchId) query.subjectBatchId = subjectBatchId;

  const enrollments = await Enrollment.find(query)
    .populate({
      path: "subjectBatchId",
      populate: [
        { path: "subjectId", select: "name code" },
        { path: "batchGroupId", select: "name" },
      ],
    })
    .sort({ createdAt: -1 });

  return successResponse(enrollments, "Enrollments fetched successfully");
});

/**
 * Enrolls one student into one or more SubjectBatch slots.
 * Seat-capacity checking and auto-rollover happen per slot inside the
 * enrollment service — see enrollStudentInSubjectBatches.
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = enrollStudentSchema.parse(body);

  const results = await enrollStudentInSubjectBatches(data.studentId, data.subjectBatchIds);

  return successResponse(results, "Enrollment processed", 201);
});

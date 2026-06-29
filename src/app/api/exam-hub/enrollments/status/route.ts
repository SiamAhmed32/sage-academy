import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { sanitizePhone, serializeEnrollmentStatus } from "@/lib/exam-hub";
import { assertRateLimit, buildRateLimitKey } from "@/lib/rate-limit";
import { connectDB } from "@/lib/mongodb";
import ExamEnrollment from "@/models/ExamEnrollment";
import ExamProgram from "@/models/ExamProgram";
import { enrollmentStatusQuerySchema } from "@/schemas/exam-hub";

export const GET = withApiHandler(async (req: NextRequest) => {
  assertRateLimit(buildRateLimitKey("exam-hub:enroll-status", req), 30, 15 * 60_000);
  await connectDB();

  const query = enrollmentStatusQuerySchema.parse({
    programSlug: req.nextUrl.searchParams.get("programSlug"),
    phone: req.nextUrl.searchParams.get("phone") || undefined,
    enrollmentId: req.nextUrl.searchParams.get("enrollmentId") || undefined,
  });

  const program = await ExamProgram.findOne({ slug: query.programSlug, status: "published" }).select("_id").lean();
  if (!program) throw new NotFoundError("Exam not found");

  let enrollment = null;

  if (query.enrollmentId) {
    enrollment = await ExamEnrollment.findOne({
      _id: query.enrollmentId,
      programId: program._id,
    }).lean();
  } else if (query.phone) {
    enrollment = await ExamEnrollment.findOne({
      programId: program._id,
      phone: sanitizePhone(query.phone),
    })
      .sort({ createdAt: -1 })
      .lean();
  } else {
    throw new BadRequestError("Phone or enrollment ID is required");
  }

  if (!enrollment) {
    return successResponse(null, "No enrollment found");
  }

  return successResponse(serializeEnrollmentStatus(enrollment), "Enrollment status fetched");
});

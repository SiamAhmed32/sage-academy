import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { getAttemptForPhone } from "@/lib/exam-hub-auth";
import { finalizeExamAttempt } from "@/lib/exam-hub-submit";
import { assertRateLimit, buildRateLimitKey } from "@/lib/rate-limit";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";
import { submitAttemptSchema } from "@/schemas/exam-hub";

type RouteContext = { params: Promise<Record<string, string>> };

export const POST = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await connectDB();
  const { attemptId } = await context.params;
  const body = submitAttemptSchema.parse(await req.json());

  assertRateLimit(buildRateLimitKey("exam-hub:submit", req, attemptId), 8, 60_000);
  await getAttemptForPhone(attemptId, body.phone);

  const result = await finalizeExamAttempt(attemptId);
  if (!result || result.status !== "submitted") {
    return successResponse(null, "Attempt could not be submitted");
  }

  const program = await ExamProgram.findById(result.programId).select("slug").lean();

  return successResponse(
    {
      attemptId,
      score: result.score,
      totalMarks: result.totalMarks,
      durationSeconds: result.durationSeconds,
      submittedAt: result.submittedAt,
      programSlug: program?.slug || "",
    },
    "Exam submitted"
  );
});

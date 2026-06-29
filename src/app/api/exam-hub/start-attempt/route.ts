import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { startExamAttempt } from "@/lib/exam-hub-start-attempt";
import { startAttemptSchema } from "@/schemas/exam-hub";

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = startAttemptSchema.parse(await req.json());
  const result = await startExamAttempt(req, {
    slug: body.programSlug,
    enrollmentId: body.enrollmentId,
    phone: body.phone,
  });

  return successResponse(
    {
      attemptId: result.attemptId,
      expiresAt: result.expiresAt,
      durationMinutes: result.durationMinutes,
    },
    result.resumed ? "Resuming in-progress attempt" : "Exam started",
    result.resumed ? 200 : 201
  );
});

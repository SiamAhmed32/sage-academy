import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { startExamAttempt } from "@/lib/exam-hub-start-attempt";
import { startAttemptBodySchema } from "@/schemas/exam-hub";

type RouteContext = { params: Promise<Record<string, string>> };

/** Legacy nested path — prefer POST /api/exam-hub/start-attempt */
export const POST = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const { slug } = await context.params;
  const body = startAttemptBodySchema.parse(await req.json());
  const result = await startExamAttempt(req, {
    slug,
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

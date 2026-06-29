import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { assertAttemptInProgress } from "@/lib/exam-hub-auth";
import { activeExamQuestionQuery } from "@/lib/exam-hub";
import { assertRateLimit, buildRateLimitKey } from "@/lib/rate-limit";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";
import { saveAnswerSchema } from "@/schemas/exam-hub";
import ExamAttempt from "@/models/ExamAttempt";

type RouteContext = { params: Promise<Record<string, string>> };

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await connectDB();
  const { attemptId } = await context.params;
  const body = saveAnswerSchema.parse(await req.json());
  assertRateLimit(buildRateLimitKey("exam-hub:answer", req, attemptId), 180, 60_000);
  const attempt = await assertAttemptInProgress(attemptId, body.phone);

  const questionExists = await ExamQuestion.findOne({
    ...activeExamQuestionQuery(attempt.programId),
    _id: body.questionId,
  }).select("_id");
  if (!questionExists) {
    return successResponse(null, "Question not in this exam");
  }

  await ExamAttempt.updateOne(
    { _id: attemptId, "answers.questionId": body.questionId },
    { $set: { "answers.$.selectedIndex": body.selectedIndex } }
  );

  return successResponse(null, "Answer saved");
});

export const GET = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await connectDB();
  const { attemptId } = await context.params;
  const phone = req.nextUrl.searchParams.get("phone") || "";
  const attempt = await assertAttemptInProgress(attemptId, phone);

  const [program, questions] = await Promise.all([
    ExamProgram.findById(attempt.programId).lean(),
    ExamQuestion.find(activeExamQuestionQuery(attempt.programId)).sort({ order: 1 }).lean(),
  ]);

  let list = questions;
  if (program?.shuffleQuestions) {
    list = [...questions].sort(() => Math.random() - 0.5);
  }

  return successResponse(
    {
      attemptId,
      expiresAt: attempt.expiresAt,
      startedAt: attempt.startedAt,
      durationMinutes: program?.durationMinutes || 20,
      title: program?.title || "",
      subtitle: program?.subtitle || "",
      questions: list.map((q) => ({
        _id: String(q._id),
        questionText: q.questionText,
        image: q.image || "",
        options: (q.options || []).map((opt: { text: string }) => ({ text: opt.text })),
        marks: q.marks || 1,
      })),
      answers: attempt.answers,
    },
    "Attempt loaded"
  );
});

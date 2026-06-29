import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError } from "@/lib/errors";
import { activeExamQuestionQuery } from "@/lib/exam-hub";
import { buildAttemptAnswerReview } from "@/lib/exam-hub-result";
import { getAttemptForPhone } from "@/lib/exam-hub-auth";
import { getCurrentAuthUser } from "@/lib/auth-session";
import { sanitizePhone } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await connectDB();
  const { attemptId } = await context.params;
  const phoneParam = req.nextUrl.searchParams.get("phone") || "";
  const user = await getCurrentAuthUser();
  const phone = phoneParam || user?.phone || "";

  if (!phone.trim()) {
    throw new BadRequestError("Could not verify exam session");
  }

  const attempt = await getAttemptForPhone(attemptId, sanitizePhone(phone));

  if (attempt.status !== "submitted") {
    throw new BadRequestError("Result is available after the exam is submitted");
  }

  const [program, questions] = await Promise.all([
    ExamProgram.findById(attempt.programId).lean(),
    ExamQuestion.find(activeExamQuestionQuery(attempt.programId)).sort({ order: 1 }).lean(),
  ]);

  const { questions: review, stats } = buildAttemptAnswerReview(
    (attempt.answers || []) as Array<{
      questionId: unknown;
      selectedIndex: number | null;
      isCorrect?: boolean | null;
      marksAwarded?: number;
    }>,
    questions as Array<{
      _id: unknown;
      questionText?: string;
      image?: string;
      options?: { text: string }[];
      correctIndex?: number;
      marks?: number;
    }>
  );

  return successResponse(
    {
      attemptId,
      status: attempt.status,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      durationSeconds: attempt.durationSeconds,
      submittedAt: attempt.submittedAt,
      startedAt: attempt.startedAt,
      name: attempt.name,
      title: program?.title || "",
      slug: program?.slug || "",
      showLeaderboard: Boolean(program?.showLeaderboard),
      stats: {
        ...stats,
        marks: attempt.score,
      },
      questions: review,
    },
    "Result fetched"
  );
});

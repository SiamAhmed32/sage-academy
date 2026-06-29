import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { activeExamQuestionQuery } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import ExamAttempt from "@/models/ExamAttempt";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { id } = await context.params;

  const attempt = await ExamAttempt.findById(id).lean();
  if (!attempt) throw new NotFoundError("Attempt not found");

  const [program, questions] = await Promise.all([
    ExamProgram.findById(attempt.programId).lean(),
    ExamQuestion.find(activeExamQuestionQuery(attempt.programId)).lean(),
  ]);

  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  return successResponse(
    {
      ...attempt,
      _id: String(attempt._id),
      programTitle: program?.title || "",
      programSlug: program?.slug || "",
      answers: (attempt.answers || []).map((answer: {
        questionId: unknown;
        selectedIndex: number | null;
        isCorrect?: boolean | null;
        marksAwarded?: number;
      }) => {
        const question = questionMap.get(String(answer.questionId));
        return {
          questionId: String(answer.questionId),
          questionText: question?.questionText || "",
          image: question?.image || "",
          options: question?.options || [],
          correctIndex: question?.correctIndex ?? null,
          selectedIndex: answer.selectedIndex,
          isCorrect: answer.isCorrect,
          marksAwarded: answer.marksAwarded,
        };
      }),
    },
    "Attempt fetched"
  );
});

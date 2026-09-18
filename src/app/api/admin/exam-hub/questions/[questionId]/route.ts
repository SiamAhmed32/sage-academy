import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import ExamQuestion from "@/models/ExamQuestion";
import { parseUpdateExamQuestionBody } from "@/lib/admin/exam-hub-question-body";

type RouteContext = { params: Promise<Record<string, string>> };

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { questionId } = await context.params;
  const body = await parseUpdateExamQuestionBody(req);

  if (body.options && body.correctIndex !== undefined && body.correctIndex >= body.options.length) {
    throw new BadRequestError("The correct option index is outside the available options.");
  }

  const question = await ExamQuestion.findByIdAndUpdate(questionId, body, { new: true, runValidators: true }).lean();
  if (!question) throw new NotFoundError("Exam question not found.");
  return successResponse(
    { ...question, _id: String(question._id), programId: String(question.programId) },
    "Exam question updated successfully."
  );
});

export const DELETE = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { questionId } = await context.params;
  const question = await ExamQuestion.findByIdAndDelete(questionId);
  if (!question) throw new NotFoundError("Exam question not found.");
  return successResponse(null, "Exam question deleted successfully.");
});

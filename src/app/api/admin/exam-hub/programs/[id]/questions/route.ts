import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";
import { parseCreateExamQuestionBody } from "@/lib/admin/exam-hub-question-body";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { id } = await context.params;
  const program = await ExamProgram.findById(id).select("_id title").lean();
  if (!program) throw new NotFoundError("Program not found");

  const questions = await ExamQuestion.find({ programId: id }).sort({ order: 1, createdAt: 1 }).lean();
  return successResponse(
    questions.map((q) => ({ ...q, _id: String(q._id), programId: String(q.programId) })),
    "Questions fetched"
  );
});

export const POST = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { id } = await context.params;
  const program = await ExamProgram.findById(id).select("_id deliveryMode").lean();
  if (!program) throw new NotFoundError("Program not found");
  if (program.deliveryMode !== "online") {
    throw new BadRequestError("Questions can only be added to online exams");
  }

  const body = await parseCreateExamQuestionBody(req, id);
  if (body.correctIndex >= body.options.length) {
    throw new BadRequestError("Correct option index is out of range");
  }

  const question = await ExamQuestion.create({ ...body, isActive: body.isActive !== false });
  return successResponse(
    { ...question.toObject(), _id: question._id.toString(), programId: id },
    "Question created",
    201
  );
});

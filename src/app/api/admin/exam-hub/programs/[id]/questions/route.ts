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
  if (!program) throw new NotFoundError("Exam program not found.");

  const questions = await ExamQuestion.find({ programId: id }).sort({ order: 1, createdAt: 1 }).lean();
  return successResponse(
    questions.map((q) => ({ ...q, _id: String(q._id), programId: String(q.programId) })),
    "Exam questions loaded successfully."
  );
});

export const POST = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { id } = await context.params;
  const program = await ExamProgram.findById(id).select("_id deliveryMode").lean();
  if (!program) throw new NotFoundError("Exam program not found.");
  if (program.deliveryMode !== "online") {
    throw new BadRequestError("Questions can only be added to online exam programs.");
  }

  const body = await parseCreateExamQuestionBody(req, id);
  if (body.correctIndex >= body.options.length) {
    throw new BadRequestError("The correct option index is outside the available options.");
  }

  const question = await ExamQuestion.create({ ...body, isActive: body.isActive !== false });
  return successResponse(
    { ...question.toObject(), _id: question._id.toString(), programId: id },
    "Exam question created successfully.",
    201
  );
});

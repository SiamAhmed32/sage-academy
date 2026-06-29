import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { parseUpdateExamProgramBody } from "@/lib/admin/exam-hub-program-body";
import { slugifyExamProgram } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, canDeleteRecords, requireRole } from "@/lib/rbac";
import ExamAttempt from "@/models/ExamAttempt";
import ExamEnrollment from "@/models/ExamEnrollment";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { id } = await context.params;
  const program = await ExamProgram.findById(id).lean();
  if (!program) throw new NotFoundError("Program not found");
  return successResponse({ ...program, _id: String(program._id) }, "Program fetched");
});

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { id } = await context.params;
  const body = await parseUpdateExamProgramBody(req);

  if (body.slug) {
    const slug = slugifyExamProgram(body.slug);
    const duplicate = await ExamProgram.findOne({ slug, _id: { $ne: id } }).select("_id");
    if (duplicate) throw new NotFoundError("Slug already in use");
    body.slug = slug;
  }

  const program = await ExamProgram.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
  if (!program) throw new NotFoundError("Program not found");
  return successResponse({ ...program, _id: String(program._id) }, "Program updated");
});

export const DELETE = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  const user = await requireRole(adminRoles);
  if (!canDeleteRecords(user.role)) {
    throw new NotFoundError("You cannot delete exam programs");
  }
  await connectDB();
  const { id } = await context.params;
  const program = await ExamProgram.findByIdAndDelete(id);
  if (!program) throw new NotFoundError("Program not found");

  await Promise.all([
    ExamQuestion.deleteMany({ programId: id }),
    ExamEnrollment.deleteMany({ programId: id }),
    ExamAttempt.deleteMany({ programId: id }),
  ]);

  return successResponse(null, "Program deleted");
});

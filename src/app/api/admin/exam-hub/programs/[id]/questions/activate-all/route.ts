import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { toProgramObjectId } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";

type RouteContext = { params: Promise<Record<string, string>> };

export const POST = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { id } = await context.params;

  const program = await ExamProgram.findById(id).select("_id").lean();
  if (!program) throw new NotFoundError("Program not found");

  const result = await ExamQuestion.updateMany(
    { programId: toProgramObjectId(id), isActive: false },
    { $set: { isActive: true } }
  );

  return successResponse(
    { updated: result.modifiedCount },
    result.modifiedCount
      ? `${result.modifiedCount} question(s) activated`
      : "All questions are already active"
  );
});

import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, canDeleteRecords, requireRole, staffRoles } from "@/lib/rbac";
import Subject from "@/models/Subject";
import SubjectBatch from "@/models/SubjectBatch";
import { updateSubjectSchema } from "@/schemas/academic-structure";

type RouteContext = { params: Promise<Record<string, string>> };

function resolveId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError("Invalid subject id");
  return id;
}

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(staffRoles);
  const { id } = await context.params;
  await connectDB();

  const record = await Subject.findById(resolveId(id)).populate("classId", "name orderIndex");
  if (!record) throw new NotFoundError("Subject not found");
  return successResponse(record, "Subject fetched successfully");
});

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = updateSubjectSchema.parse(body);

  const updated = await Subject.findByIdAndUpdate(resolveId(id), data, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new NotFoundError("Subject not found");
  return successResponse(updated, "Subject updated successfully");
});

export const DELETE = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  const user = await requireRole(adminRoles);
  if (!canDeleteRecords(user.role)) {
    throw new ConflictError("Only admins can delete subjects");
  }
  const { id } = await context.params;
  await connectDB();

  const inUse = await SubjectBatch.exists({ subjectId: id });
  if (inUse) {
    throw new ConflictError("Cannot delete a subject that already has batch slots created from it.");
  }

  const deleted = await Subject.findByIdAndDelete(resolveId(id));
  if (!deleted) throw new NotFoundError("Subject not found");
  return successResponse(null, "Subject deleted successfully");
});

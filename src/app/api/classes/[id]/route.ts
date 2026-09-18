import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, canDeleteRecords, requireRole, staffRoles } from "@/lib/rbac";
import Class from "@/models/Class";
import Subject from "@/models/Subject";
import { updateClassSchema } from "@/schemas/academic-structure";
import mongoose from "mongoose";

type RouteContext = { params: Promise<Record<string, string>> };

function resolveId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError("Invalid class id");
  return id;
}

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(staffRoles);
  const { id } = await context.params;
  await connectDB();

  const record = await Class.findById(resolveId(id));
  if (!record) throw new NotFoundError("Class not found");
  return successResponse(record, "Class fetched successfully");
});

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = updateClassSchema.parse(body);

  const updated = await Class.findByIdAndUpdate(resolveId(id), data, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new NotFoundError("Class not found");
  return successResponse(updated, "Class updated successfully");
});

export const DELETE = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  const user = await requireRole(adminRoles);
  if (!canDeleteRecords(user.role)) {
    throw new ConflictError("Only admins can delete classes");
  }
  const { id } = await context.params;
  await connectDB();

  const inUse = await Subject.exists({ classId: id });
  if (inUse) {
    throw new ConflictError("Cannot delete a class that still has subjects. Remove its subjects first.");
  }

  const deleted = await Class.findByIdAndDelete(resolveId(id));
  if (!deleted) throw new NotFoundError("Class not found");
  return successResponse(null, "Class deleted successfully");
});

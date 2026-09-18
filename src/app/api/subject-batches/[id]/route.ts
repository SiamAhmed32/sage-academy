import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, canDeleteRecords, requireRole, staffRoles } from "@/lib/rbac";
import Enrollment from "@/models/Enrollment";
import SubjectBatch from "@/models/SubjectBatch";
import { updateSubjectBatchSchema } from "@/schemas/academic-structure";
import { getActiveSeatCount } from "@/lib/enrollment-service";

type RouteContext = { params: Promise<Record<string, string>> };

function resolveId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError("Invalid subject batch id");
  return id;
}

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(staffRoles);
  const { id } = await context.params;
  await connectDB();

  const slot = await SubjectBatch.findById(resolveId(id))
    .populate("subjectId", "name code baseMonthlyFee")
    .populate("teacherId", "name")
    .populate("batchGroupId", "name");
  if (!slot) throw new NotFoundError("Subject batch not found");

  const seatsUsed = await getActiveSeatCount(id);
  return successResponse(
    { ...slot.toObject(), seatsUsed, seatsAvailable: Math.max(0, slot.maxSeats - seatsUsed) },
    "Subject batch fetched successfully"
  );
});

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = updateSubjectBatchSchema.parse(body);

  const updated = await SubjectBatch.findByIdAndUpdate(resolveId(id), data, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new NotFoundError("Subject batch not found");
  return successResponse(updated, "Subject batch updated successfully");
});

export const DELETE = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  const user = await requireRole(adminRoles);
  if (!canDeleteRecords(user.role)) {
    throw new ConflictError("Only admins can delete subject batches");
  }
  const { id } = await context.params;
  await connectDB();

  const hasEnrollments = await Enrollment.exists({ subjectBatchId: id, status: "ACTIVE" });
  if (hasEnrollments) {
    throw new ConflictError("Cannot delete a subject batch with active enrollments.");
  }

  const deleted = await SubjectBatch.findByIdAndDelete(resolveId(id));
  if (!deleted) throw new NotFoundError("Subject batch not found");
  return successResponse(null, "Subject batch deleted successfully");
});

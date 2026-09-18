import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, canDeleteRecords, requireRole, staffRoles } from "@/lib/rbac";
import BatchGroup from "@/models/BatchGroup";
import SubjectBatch from "@/models/SubjectBatch";
import Enrollment from "@/models/Enrollment";
import { updateBatchGroupSchema } from "@/schemas/academic-structure";

type RouteContext = { params: Promise<Record<string, string>> };

function resolveId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError("Invalid batch group id");
  return id;
}

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(staffRoles);
  const { id } = await context.params;
  await connectDB();

  const group = await BatchGroup.findById(resolveId(id)).populate("classId", "name orderIndex");
  if (!group) throw new NotFoundError("Batch group not found");

  const subjectBatches = await SubjectBatch.find({ batchGroupId: id })
    .populate("subjectId", "name code baseMonthlyFee")
    .populate("teacherId", "name")
    .sort({ createdAt: 1 });

  return successResponse({ batchGroup: group, subjectBatches }, "Batch group fetched successfully");
});

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = updateBatchGroupSchema.parse(body);

  const updated = await BatchGroup.findByIdAndUpdate(resolveId(id), data, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new NotFoundError("Batch group not found");
  return successResponse(updated, "Batch group updated successfully");
});

export const DELETE = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  const user = await requireRole(adminRoles);
  if (!canDeleteRecords(user.role)) {
    throw new ConflictError("Only admins can delete batch groups");
  }
  const { id } = await context.params;
  await connectDB();

  const slots = await SubjectBatch.find({ batchGroupId: id }).select("_id");
  const slotIds = slots.map((s) => s._id);
  const hasEnrollments = slotIds.length
    ? await Enrollment.exists({ subjectBatchId: { $in: slotIds }, status: "ACTIVE" })
    : false;

  if (hasEnrollments) {
    throw new ConflictError("Cannot delete a batch group that has active student enrollments.");
  }

  await SubjectBatch.deleteMany({ batchGroupId: id });
  const deleted = await BatchGroup.findByIdAndDelete(resolveId(id));
  if (!deleted) throw new NotFoundError("Batch group not found");

  return successResponse(null, "Batch group deleted successfully");
});

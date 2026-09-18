import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import BatchGroup from "@/models/BatchGroup";
import Subject from "@/models/Subject";
import SubjectBatch from "@/models/SubjectBatch";
import { createSubjectBatchSchema } from "@/schemas/academic-structure";

type RouteContext = { params: Promise<Record<string, string>> };

/** Adds one more SubjectBatch slot to an existing BatchGroup. */
export const POST = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError("Invalid batch group id");
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = createSubjectBatchSchema.parse({ ...body, batchGroupId: id });

  const group = await BatchGroup.findById(id);
  if (!group) throw new NotFoundError("Batch group not found");

  const subject = await Subject.findById(data.subjectId);
  if (!subject) throw new NotFoundError("Subject not found");

  const created = await SubjectBatch.create({
    batchGroupId: id,
    subjectId: data.subjectId,
    teacherId: data.teacherId || null,
    maxSeats: data.maxSeats,
    monthlyFee: data.monthlyFee ?? subject.baseMonthlyFee,
  });

  return successResponse(created, "Subject batch slot created successfully", 201);
});

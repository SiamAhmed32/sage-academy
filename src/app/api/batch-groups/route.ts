import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole, staffRoles } from "@/lib/rbac";
import BatchGroup from "@/models/BatchGroup";
import Class from "@/models/Class";
import Subject from "@/models/Subject";
import SubjectBatch from "@/models/SubjectBatch";
import { createBatchGroupSchema } from "@/schemas/academic-structure";

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(staffRoles);
  await connectDB();

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const query: Record<string, unknown> = { isArchived: { $ne: true } };
  if (classId) query.classId = classId;

  const groups = await BatchGroup.find(query)
    .populate("classId", "name orderIndex")
    .sort({ createdAt: -1 });

  return successResponse(groups, "Batch groups fetched successfully");
});

/**
 * Creates a BatchGroup and, optionally in the same call, the SubjectBatch
 * "slots" nested under it (e.g. create "Class 7 - Boys - Bangla - Batch 1"
 * with Math, Science and English slots all at once).
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = createBatchGroupSchema.parse(body);

  const parentClass = await Class.findById(data.classId);
  if (!parentClass) throw new NotFoundError("Selected class not found");

  const existing = await BatchGroup.findOne({
    classId: data.classId,
    gender: data.gender,
    medium: data.medium,
    batchNumber: data.batchNumber,
  });
  if (existing) {
    throw new ConflictError(
      `A batch group with this class, gender, medium and batch number already exists (${existing.name}).`
    );
  }

  const group = await BatchGroup.create({
    name: data.name,
    classId: data.classId,
    gender: data.gender,
    medium: data.medium,
    batchNumber: data.batchNumber,
  });

  const createdSlots = [];
  for (const slot of data.subjectBatches) {
    const subject = await Subject.findById(slot.subjectId);
    if (!subject) continue; // skip unknown subjects rather than failing the whole group
    const created = await SubjectBatch.create({
      batchGroupId: group._id,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId || null,
      maxSeats: slot.maxSeats,
      monthlyFee: slot.monthlyFee ?? subject.baseMonthlyFee,
    });
    createdSlots.push(created);
  }

  return successResponse(
    { batchGroup: group, subjectBatches: createdSlots },
    "Batch group created successfully",
    201
  );
});

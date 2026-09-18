import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import BatchGroup from "@/models/BatchGroup";
import Class from "@/models/Class";
import Routine from "@/models/Routine";
import Subject from "@/models/Subject";
import SubjectBatch from "@/models/SubjectBatch";
import { createCompositeBatchSchema } from "@/schemas/batch-composite";

/**
 * Screen 1 — "Create Batch": one submit creates the BatchGroup, every
 * SubjectBatch slot for it, and every Routine row for those slots, as a
 * single atomic transaction. Either the whole batch is created, or none of
 * it is — the admin never ends up with a batch group that's missing half
 * its subjects because one write failed partway through.
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = createCompositeBatchSchema.parse(body);

  const parentClass = await Class.findById(data.classId);
  if (!parentClass) throw new NotFoundError("Selected class not found");

  const existingGroup = await BatchGroup.findOne({
    classId: data.classId,
    gender: data.gender,
    medium: data.medium,
    batchNumber: data.batchNumber,
  });
  if (existingGroup) {
    throw new ConflictError(
      `A batch group with this class, gender, medium and batch number already exists (${existingGroup.name}).`
    );
  }

  const subjectIds = data.subjects.map((s) => s.subjectId);
  const subjects = await Subject.find({ _id: { $in: subjectIds }, classId: data.classId });
  if (subjects.length !== new Set(subjectIds).size) {
    throw new NotFoundError("One or more selected subjects were not found for this class");
  }

  const session = await mongoose.startSession();
  try {
    let result: { batchGroup: unknown; subjectBatches: unknown[]; routineCount: number } | null = null;

    await session.withTransaction(async () => {
      const [batchGroup] = await BatchGroup.create(
        [
          {
            name: data.name,
            classId: data.classId,
            gender: data.gender,
            medium: data.medium,
            batchNumber: data.batchNumber,
          },
        ],
        { session }
      );

      const createdSubjectBatches = [];
      let routineCount = 0;

      for (const row of data.subjects) {
        const [slot] = await SubjectBatch.create(
          [
            {
              batchGroupId: batchGroup._id,
              subjectId: row.subjectId,
              teacherId: row.teacherId || null,
              maxSeats: row.maxSeats,
              monthlyFee: row.monthlyFee,
            },
          ],
          { session }
        );
        createdSubjectBatches.push(slot);

        if (row.routines.length > 0) {
          await Routine.insertMany(
            row.routines.map((r) => ({
              subjectBatchId: slot._id,
              dayOfWeek: r.dayOfWeek,
              startTime: r.startTime,
              endTime: r.endTime,
              roomNumber: r.roomNumber,
            })),
            { session }
          );
          routineCount += row.routines.length;
        }
      }

      result = { batchGroup, subjectBatches: createdSubjectBatches, routineCount };
    });

    return successResponse(result, "Batch created successfully", 201);
  } finally {
    await session.endSession();
  }
});

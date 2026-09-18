import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { staffRoles, requireRole } from "@/lib/rbac";
import BatchGroup from "@/models/BatchGroup";
import SubjectBatch from "@/models/SubjectBatch";
import Enrollment from "@/models/Enrollment";

/**
 * Powers the "New Admission" screen's reactive batch/subject picker: given a
 * class + medium + gender, returns every matching BatchGroup with its
 * SubjectBatch slots and a live seats-used count for each, so the UI can
 * show "General Math - Batch 1 [18/30 seats]" without a separate round trip
 * per slot.
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(staffRoles);
  await connectDB();

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const medium = searchParams.get("medium")?.toUpperCase();
  const gender = searchParams.get("gender")?.toUpperCase();

  if (!classId) throw new BadRequestError("classId is required");

  const query: Record<string, unknown> = { classId, isArchived: { $ne: true } };
  if (medium) query.medium = medium;
  if (gender) query.gender = { $in: [gender, "COMBINED"] };

  const groups = await BatchGroup.find(query).sort({ batchNumber: 1 }).lean();
  const groupIds = groups.map((g) => g._id);

  const slots = groupIds.length
    ? await SubjectBatch.find({ batchGroupId: { $in: groupIds }, isActive: true })
        .populate("subjectId", "name code")
        .populate("teacherId", "name")
        .sort({ createdAt: 1 })
        .lean()
    : [];

  const slotIds = slots.map((s) => s._id);
  const seatCounts: Array<{ _id: string; count: number }> = slotIds.length
    ? await Enrollment.aggregate([
        { $match: { subjectBatchId: { $in: slotIds }, status: "ACTIVE" } },
        { $group: { _id: "$subjectBatchId", count: { $sum: 1 } } },
      ])
    : [];
  const seatMap = new Map(seatCounts.map((s) => [String(s._id), s.count]));

  const slotsByGroup = new Map<string, unknown[]>();
  for (const slot of slots) {
    const key = String(slot.batchGroupId);
    const used = seatMap.get(String(slot._id)) ?? 0;
    const enriched = { ...slot, seatsUsed: used, seatsAvailable: Math.max(0, slot.maxSeats - used) };
    slotsByGroup.set(key, [...(slotsByGroup.get(key) ?? []), enriched]);
  }

  const result = groups.map((group) => ({
    ...group,
    subjectBatches: slotsByGroup.get(String(group._id)) ?? [],
  }));

  return successResponse(result, "Available batches fetched successfully");
});

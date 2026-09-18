import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { staffRoles, requireRole } from "@/lib/rbac";
import SubjectBatch from "@/models/SubjectBatch";
import { getActiveSeatCount } from "@/lib/enrollment-service";

/**
 * Lists SubjectBatch slots, optionally filtered by subject — used by the
 * "Transfer Subject Batch" screen to show every alternate section a student
 * could move into for the same subject, each with a live seat count.
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(staffRoles);
  await connectDB();

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");

  const query: Record<string, unknown> = { isActive: true };
  if (subjectId) query.subjectId = subjectId;

  const slots = await SubjectBatch.find(query)
    .populate("subjectId", "name code")
    .populate("batchGroupId", "name")
    .populate("teacherId", "name")
    .sort({ createdAt: 1 })
    .lean();

  const enriched = await Promise.all(
    slots.map(async (slot) => {
      const used = await getActiveSeatCount(String(slot._id));
      return { ...slot, seatsUsed: used, seatsAvailable: Math.max(0, slot.maxSeats - used) };
    })
  );

  return successResponse(enriched, "Subject batches fetched successfully");
});

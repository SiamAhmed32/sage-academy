import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import { transferEnrollment } from "@/lib/enrollment-service";
import { transferEnrollmentSchema } from "@/schemas/admission";

type RouteContext = { params: Promise<Record<string, string>> };

/**
 * Screen 3 — "Transfer Subject Batch": moves a student's enrollment from
 * their current SubjectBatch slot to a different one, with a hard seat check
 * (no silent rollover here — the admin explicitly chose the target).
 */
export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError("Invalid enrollment id");
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = transferEnrollmentSchema.parse(body);

  const updated = await transferEnrollment(id, data.newSubjectBatchId);
  return successResponse(updated, "Enrollment transferred successfully");
});

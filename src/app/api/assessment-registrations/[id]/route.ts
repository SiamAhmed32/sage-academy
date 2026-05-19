import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { requireRole, staffRoles } from "@/lib/rbac";
import AssessmentRegistration from "@/models/AssessmentRegistration";
import { assessmentLeadStatusOptions } from "@/schemas/assessment";

type RouteContext = { params: Promise<Record<string, string>> };

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(staffRoles);
  await connectDB();
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const update: Record<string, string> = {};
  if (assessmentLeadStatusOptions.includes(body.status)) update.status = body.status;
  if (typeof body.adminNote === "string") update.adminNote = body.adminNote.trim().slice(0, 2000);
  const item = await AssessmentRegistration.findByIdAndUpdate(id, update, { new: true });
  if (!item) throw new NotFoundError("Registration not found");
  return successResponse(item, "Registration updated");
});

import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import { dropEnrollment } from "@/lib/enrollment-service";

type RouteContext = { params: Promise<Record<string, string>> };

/** Drops a student's enrollment in a subject batch, freeing the seat. */
export const DELETE = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError("Invalid enrollment id");
  await connectDB();

  const dropped = await dropEnrollment(id);
  return successResponse(dropped, "Enrollment dropped successfully");
});

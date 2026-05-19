import { NextRequest } from "next/server";
import { ZodError } from "zod";

import {
  assertAdmissionRequestFound,
  buildAdmissionRequestUpdate,
  resolveAdmissionRequestId,
  throwAdmissionRequestValidation,
} from "@/app/api/admission-requests/shared";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { ForbiddenError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { canDeleteRecords, staffRoles, requireRole } from "@/lib/rbac";
import AdmissionRequest from "@/models/AdmissionRequest";
import { updateAdmissionRequestSchema } from "@/schemas/admission-request";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(staffRoles);
  const { id } = await context.params;
  const requestId = resolveAdmissionRequestId(id);

  await connectDB();
  const request = await AdmissionRequest.findById(requestId);

  return successResponse(assertAdmissionRequestFound(request), "Admission request fetched successfully");
});

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(staffRoles);
  const { id } = await context.params;
  const requestId = resolveAdmissionRequestId(id);

  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let validatedData;
  try {
    validatedData = updateAdmissionRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwAdmissionRequestValidation(error);
    throw error;
  }

  const request = await AdmissionRequest.findByIdAndUpdate(
    requestId,
    buildAdmissionRequestUpdate(validatedData),
    { new: true, runValidators: true }
  );

  return successResponse(assertAdmissionRequestFound(request), "Admission request updated successfully");
});

export const DELETE = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  const user = await requireRole(staffRoles);
  if (!canDeleteRecords(user.role)) {
    throw new ForbiddenError("Only admins can delete admission requests");
  }

  const { id } = await context.params;
  const requestId = resolveAdmissionRequestId(id);

  await connectDB();
  const request = await AdmissionRequest.findByIdAndDelete(requestId);

  assertAdmissionRequestFound(request);

  return successResponse(null, "Admission request deleted successfully");
});

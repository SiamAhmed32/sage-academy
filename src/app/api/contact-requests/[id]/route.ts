import { NextRequest } from "next/server";
import { ZodError } from "zod";

import {
  assertContactRequestFound,
  buildContactRequestUpdate,
  resolveContactRequestId,
  throwContactRequestValidation,
} from "@/app/api/contact-requests/shared";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { ForbiddenError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { canDeleteRecords, staffRoles, requireRole } from "@/lib/rbac";
import ContactRequest from "@/models/ContactRequest";
import { updateContactRequestSchema } from "@/schemas/contact-request";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(staffRoles);
  const { id } = await context.params;
  const requestId = resolveContactRequestId(id);

  await connectDB();
  const request = await ContactRequest.findById(requestId);

  return successResponse(assertContactRequestFound(request), "Contact request fetched successfully");
});

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(staffRoles);
  const { id } = await context.params;
  const requestId = resolveContactRequestId(id);

  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let validatedData;
  try {
    validatedData = updateContactRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwContactRequestValidation(error);
    throw error;
  }

  const request = await ContactRequest.findByIdAndUpdate(
    requestId,
    buildContactRequestUpdate(validatedData),
    { new: true, runValidators: true }
  );

  return successResponse(assertContactRequestFound(request), "Contact request updated successfully");
});

export const DELETE = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  const user = await requireRole(staffRoles);
  if (!canDeleteRecords(user.role)) {
    throw new ForbiddenError("Only admins can delete contact requests");
  }

  const { id } = await context.params;
  const requestId = resolveContactRequestId(id);

  await connectDB();
  const request = await ContactRequest.findByIdAndDelete(requestId);

  assertContactRequestFound(request);

  return successResponse(null, "Contact request deleted successfully");
});

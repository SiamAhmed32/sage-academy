import { NextRequest } from "next/server";
import { ZodError } from "zod";

import {
  assertFound,
  buildAcademicBatchUpdate,
  resolveObjectId,
  throwValidation,
} from "@/app/api/batches/shared";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { batchPayloadFromFormData } from "@/lib/batch-request";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import AcademicBatch from "@/models/AcademicBatch";
import { updateAcademicBatchSchema } from "@/schemas/academic-batch";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  await connectDB();

  const batch = await AcademicBatch.findById(resolveObjectId(id)).populate(
    "subjects.teacher",
    "name subject designation experience image"
  );

  return successResponse(assertFound(batch), "AcademicBatch fetched successfully");
});

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  await connectDB();

  const contentType = req.headers.get("content-type") ?? "";
  let body: unknown = {};

  if (contentType.includes("multipart/form-data")) {
    body = await batchPayloadFromFormData(await req.formData());
  } else {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  let validatedData;
  try {
    validatedData = updateAcademicBatchSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwValidation(error);
    throw error;
  }

  const batch = await AcademicBatch.findByIdAndUpdate(
    resolveObjectId(id),
    buildAcademicBatchUpdate(validatedData),
    { new: true, runValidators: true }
  );

  return successResponse(assertFound(batch), "AcademicBatch updated successfully");
});

export const DELETE = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  const batchId = resolveObjectId(id);
  const permanent = new URL(req.url).searchParams.get("permanent") === "true";
  await connectDB();

  if (permanent) {
    const removed = await AcademicBatch.findByIdAndDelete(batchId);
    return successResponse(assertFound(removed), "AcademicBatch deleted permanently");
  }

  const batch = await AcademicBatch.findByIdAndUpdate(
    batchId,
    {
      isActive: false,
      isArchived: true,
      websiteVisible: false,
      featured: false,
      archivedAt: new Date(),
      status: "আর্কাইভড",
    },
    { new: true, runValidators: true }
  );

  return successResponse(assertFound(batch), "AcademicBatch archived successfully");
});

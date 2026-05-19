import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { throwContactRequestValidation } from "@/app/api/contact-requests/shared";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { staffRoles, requireRole } from "@/lib/rbac";
import ContactRequest from "@/models/ContactRequest";
import { createContactRequestSchema } from "@/schemas/contact-request";

export const GET = withApiHandler(async () => {
  await requireRole(staffRoles);
  await connectDB();

  const requests = await ContactRequest.find().sort({ createdAt: -1 });

  return successResponse(requests, "Contact requests fetched successfully");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let validatedData;
  try {
    validatedData = createContactRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwContactRequestValidation(error);
    throw error;
  }

  const request = await ContactRequest.create(validatedData);

  return successResponse(request, "Contact request submitted successfully", 201);
});

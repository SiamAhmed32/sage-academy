import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { throwTeacherValidation } from "@/app/api/teachers/shared";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import Teacher from "@/models/Teacher";
import { createTeacherSchema } from "@/schemas/teacher";

export const GET = withApiHandler(async () => {
  await connectDB();

  const teachers = await Teacher.find()
    .select("name subject designation experience quote image isFeatured order createdAt updatedAt")
    .sort({
      isFeatured: -1,
      order: 1,
      createdAt: 1,
    })
    .lean();

  return successResponse(teachers, "Teachers fetched successfully");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let validatedData;
  try {
    validatedData = createTeacherSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwTeacherValidation(error);
    throw error;
  }

  const teacher = await Teacher.create(validatedData);

  return successResponse(teacher, "Teacher created successfully", 201);
});

import { NextRequest } from "next/server";
import { ZodError } from "zod";

import {
  assertTeacherFound,
  buildTeacherUpdate,
  resolveTeacherId,
  throwTeacherValidation,
} from "@/app/api/teachers/shared";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import Teacher from "@/models/Teacher";
import { updateTeacherSchema } from "@/schemas/teacher";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const teacherId = resolveTeacherId(id);

  await connectDB();

  const teacher = await Teacher.findById(teacherId);

  return successResponse(assertTeacherFound(teacher), "Teacher fetched successfully");
});

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  const teacherId = resolveTeacherId(id);

  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let validatedData;
  try {
    validatedData = updateTeacherSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwTeacherValidation(error);
    throw error;
  }

  const teacher = await Teacher.findByIdAndUpdate(
    teacherId,
    buildTeacherUpdate(validatedData),
    {
      new: true,
      runValidators: true,
    }
  );

  return successResponse(assertTeacherFound(teacher), "Teacher updated successfully");
});

export const DELETE = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  const teacherId = resolveTeacherId(id);

  await connectDB();

  const teacher = await Teacher.findByIdAndDelete(teacherId);

  assertTeacherFound(teacher);

  return successResponse(null, "Teacher deleted successfully");
});

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
import { uploadTeacherImage } from "@/lib/upload-teacher-image";
import Teacher from "@/models/Teacher";
import { updateTeacherSchema } from "@/schemas/teacher";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export const PUT = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  const teacherId = resolveTeacherId(id);
  await connectDB();

  let body: unknown;
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("imageFile");
    const uploadedImage =
      file instanceof File && file.size > 0 ? await uploadTeacherImage(file) : "";
    body = {
      name: formValue(formData, "name"),
      subject: formValue(formData, "subject"),
      designation: formValue(formData, "designation"),
      experience: formValue(formData, "experience"),
      quote: formValue(formData, "quote"),
      image: uploadedImage || formValue(formData, "image"),
      isFeatured: formValue(formData, "isFeatured") === "true",
      order: Number(formValue(formData, "order") || 0),
    };
  } else {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  let validatedData;
  try {
    validatedData = updateTeacherSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwTeacherValidation(error);
    throw error;
  }

  // Check for duplicate order
  if (validatedData.order !== undefined) {
    const duplicate = await Teacher.findOne({ 
      order: validatedData.order, 
      _id: { $ne: teacherId } 
    });
    if (duplicate) {
      throw new Error(`সিরিয়াল নম্বর ${validatedData.order} ইতিমধ্যে শিক্ষক "${duplicate.name}" এর জন্য ব্যবহৃত হচ্ছে।`);
    }
  }

  const teacher = await Teacher.findByIdAndUpdate(teacherId, buildTeacherUpdate(validatedData), {
    new: true,
    runValidators: true,
  });

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

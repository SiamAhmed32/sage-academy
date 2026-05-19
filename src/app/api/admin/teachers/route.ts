import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { throwTeacherValidation } from "@/app/api/teachers/shared";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import { uploadTeacherImage } from "@/lib/upload-teacher-image";
import Teacher from "@/models/Teacher";
import { createTeacherSchema } from "@/schemas/teacher";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
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
    validatedData = createTeacherSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwTeacherValidation(error);
    throw error;
  }

  // Check for duplicate order
  if (validatedData.order !== undefined) {
    const duplicate = await Teacher.findOne({ order: validatedData.order });
    if (duplicate) {
      throw new Error(`সিরিয়াল নম্বর ${validatedData.order} ইতিমধ্যে শিক্ষক "${duplicate.name}" এর জন্য ব্যবহৃত হচ্ছে।`);
    }
  }

  const teacher = await Teacher.create(validatedData);

  return successResponse(teacher, "Teacher created successfully", 201);
});

export const GET = withApiHandler(async (req: NextRequest) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  
  const q = searchParams.get("q") || "";
  const subject = searchParams.get("subject") || "";
  const isFeatured = searchParams.get("isFeatured");
  const sort = searchParams.get("sort") || "order:asc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { subject: { $regex: q, $options: "i" } },
    ];
  }

  if (subject) {
    query.subject = subject;
  }

  if (isFeatured !== null && isFeatured !== "") {
    query.isFeatured = isFeatured === "true";
  }

  // Handle Sort
  const [sortField, sortOrder] = sort.split(":");
  const sortOption: Record<string, 1 | -1> = {};
  sortOption[sortField || "order"] = sortOrder === "desc" ? -1 : 1;

  const [teachers, total] = await Promise.all([
    Teacher.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Teacher.countDocuments(query),
  ]);

  return successResponse(
    {
      items: teachers,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
    "Teachers fetched successfully"
  );
});

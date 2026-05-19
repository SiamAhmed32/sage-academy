import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { throwTestimonialValidation } from "@/app/api/testimonials/shared";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import { uploadTestimonialImage } from "@/lib/upload-testimonial-image";
import Testimonial from "@/models/Testimonial";
import { createTestimonialSchema } from "@/schemas/testimonial";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export const GET = withApiHandler(async () => {
  await connectDB();

  const testimonials = await Testimonial.find({
    isFeatured: true,
    $or: [{ source: "admin" }, { source: { $exists: false } }, { source: "" }],
  }).sort({
    order: 1,
    createdAt: 1,
  });

  return successResponse(testimonials, "Testimonials fetched successfully");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  let body: unknown;
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("imageFile");
    const uploadedImage =
      file instanceof File && file.size > 0 ? await uploadTestimonialImage(file) : "";

    body = {
      name: formValue(formData, "name"),
      role: formValue(formData, "role") || "student",
      className: formValue(formData, "className"),
      review: formValue(formData, "review"),
      rating: Number(formValue(formData, "rating") || 5),
      image: uploadedImage || formValue(formData, "image"),
      isFeatured: formValue(formData, "isFeatured") === "true",
      order: Number(formValue(formData, "order") || 0),
      source: "admin",
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
    validatedData = createTestimonialSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwTestimonialValidation(error);
    throw error;
  }

  const testimonial = await Testimonial.create({ ...validatedData, source: "admin" });

  return successResponse(testimonial, "Testimonial created successfully", 201);
});

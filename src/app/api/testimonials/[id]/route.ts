import { NextRequest } from "next/server";
import { ZodError } from "zod";

import {
  assertTestimonialFound,
  buildTestimonialUpdate,
  resolveTestimonialId,
  throwTestimonialValidation,
} from "@/app/api/testimonials/shared";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import { uploadTestimonialImage } from "@/lib/upload-testimonial-image";
import Testimonial from "@/models/Testimonial";
import { updateTestimonialSchema } from "@/schemas/testimonial";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const testimonialId = resolveTestimonialId(id);

  await connectDB();

  const testimonial = await Testimonial.findById(testimonialId);

  return successResponse(assertTestimonialFound(testimonial), "Testimonial fetched successfully");
});

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  const testimonialId = resolveTestimonialId(id);

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
    validatedData = updateTestimonialSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwTestimonialValidation(error);
    throw error;
  }

  const testimonial = await Testimonial.findByIdAndUpdate(
    testimonialId,
    buildTestimonialUpdate(validatedData),
    { new: true, runValidators: true }
  );

  return successResponse(assertTestimonialFound(testimonial), "Testimonial updated successfully");
});

export const DELETE = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  const testimonialId = resolveTestimonialId(id);

  await connectDB();

  const testimonial = await Testimonial.findByIdAndDelete(testimonialId);

  assertTestimonialFound(testimonial);

  return successResponse(null, "Testimonial deleted successfully");
});

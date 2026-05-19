import mongoose from "mongoose";
import { ZodError } from "zod";

import { BadRequestError, NotFoundError, ValidationError } from "@/lib/errors";
import type { TestimonialUpdatePayload } from "@/schemas/testimonial";

export function resolveTestimonialId(id: string): string {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid testimonial id");
  }

  return id;
}

export function assertTestimonialFound<T>(doc: T | null): T {
  if (!doc) {
    throw new NotFoundError("Testimonial not found");
  }

  return doc;
}

export function throwTestimonialValidation(error: ZodError): never {
  const message = error.issues[0]?.message ?? "Validation failed";
  throw new ValidationError(message);
}

export function buildTestimonialUpdate(
  body: TestimonialUpdatePayload
): TestimonialUpdatePayload {
  const update: TestimonialUpdatePayload = {};

  if (body.name !== undefined) update.name = body.name.trim();
  if (body.role !== undefined) update.role = body.role;
  if (body.className !== undefined) update.className = body.className.trim();
  if (body.review !== undefined) update.review = body.review.trim();
  if (body.rating !== undefined) update.rating = body.rating;
  if (body.image !== undefined) update.image = body.image.trim();
  if (body.isFeatured !== undefined) update.isFeatured = body.isFeatured;
  if (body.order !== undefined) update.order = body.order;

  return update;
}

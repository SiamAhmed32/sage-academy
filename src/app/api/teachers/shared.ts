import mongoose from "mongoose";
import { ZodError } from "zod";

import { BadRequestError, NotFoundError, ValidationError } from "@/lib/errors";
import type { TeacherUpdatePayload } from "@/schemas/teacher";

export function resolveTeacherId(id: string): string {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid teacher id");
  }

  return id;
}

export function assertTeacherFound<T>(doc: T | null): T {
  if (!doc) {
    throw new NotFoundError("Teacher not found");
  }

  return doc;
}

export function throwTeacherValidation(error: ZodError): never {
  const message = error.issues[0]?.message ?? "Validation failed";
  throw new ValidationError(message);
}

export function buildTeacherUpdate(body: TeacherUpdatePayload): TeacherUpdatePayload {
  const update: TeacherUpdatePayload = {};

  if (body.name !== undefined) update.name = body.name.trim();
  if (body.subject !== undefined) update.subject = body.subject.trim();
  if (body.designation !== undefined) update.designation = body.designation.trim();
  if (body.experience !== undefined) update.experience = body.experience.trim();
  if (body.quote !== undefined) update.quote = body.quote.trim();
  if (body.image !== undefined) update.image = body.image.trim();
  if (body.isFeatured !== undefined) update.isFeatured = body.isFeatured;
  if (body.order !== undefined) update.order = body.order;

  return update;
}

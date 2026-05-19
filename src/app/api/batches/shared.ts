import mongoose from "mongoose";
import { ZodError } from "zod";

import { BadRequestError, NotFoundError, ValidationError } from "@/lib/errors";

export type AcademicBatchPayload = {
  title?: string;
  batchCode?: string;
  classLevel?: number;
  genderGroup?: "male" | "female" | "combined";
  version?: "bangla" | "english";
  subjects?: Array<{
    subjectName: string;
    teacher: string | null;
    days: string[];
    startTime: string;
    endTime: string;
    monthlyFee: number;
  }>;
  routineNote?: string;
  examSchedule?: string;
  totalSeats?: number;
  availableSeats?: number;
  status?: string;
  isActive?: boolean;
};

/** Validate and resolve a route :id param, throw if invalid. */
export function resolveObjectId(id: string): string {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid batch id");
  }
  return id;
}

/** Assert a fetched document is non-null, throw 404 if not found. */
export function assertFound<T>(doc: T | null, name = "AcademicBatch"): T {
  if (!doc) throw new NotFoundError(`${name} not found`);
  return doc;
}

/** Extract the first Zod issue message and throw a ValidationError. */
export function throwValidation(error: ZodError): never {
  const message = error.issues[0]?.message ?? "Validation failed";
  throw new ValidationError(message);
}

/** Build a partial update object from a request body. */
export function buildAcademicBatchUpdate(body: AcademicBatchPayload): AcademicBatchPayload {
  const update: AcademicBatchPayload = {};

  if (body.title !== undefined) update.title = body.title.trim();
  if (body.batchCode !== undefined) update.batchCode = body.batchCode.trim().toUpperCase();
  if (body.classLevel !== undefined) update.classLevel = body.classLevel;
  if (body.genderGroup !== undefined) update.genderGroup = body.genderGroup;
  if (body.version !== undefined) update.version = body.version;
  if (body.subjects !== undefined) update.subjects = body.subjects;
  if (body.routineNote !== undefined) update.routineNote = body.routineNote.trim();
  if (body.examSchedule !== undefined) update.examSchedule = body.examSchedule.trim();
  if (body.totalSeats !== undefined) update.totalSeats = body.totalSeats;
  if (body.availableSeats !== undefined) update.availableSeats = body.availableSeats;
  if (body.status !== undefined) update.status = body.status.trim();
  if (body.isActive !== undefined) update.isActive = body.isActive;

  return update;
}

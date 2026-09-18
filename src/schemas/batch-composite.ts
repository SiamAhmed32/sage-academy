import { z } from "zod";

const objectId = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const routineSlotSchema = z.object({
  dayOfWeek: z.enum([
    "SATURDAY",
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ]),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
  roomNumber: z.string().trim().max(40).optional().default(""),
});

const subjectRowSchema = z.object({
  subjectId: objectId,
  maxSeats: z.number().int().min(1).default(30),
  monthlyFee: z.number().min(0),
  teacherId: objectId.optional().or(z.literal("")).default(""),
  routines: z.array(routineSlotSchema).optional().default([]),
});

/**
 * One-screen batch setup: create the BatchGroup, every SubjectBatch slot for
 * it, and every Routine row for those slots, all validated together so the
 * whole "Create Batch" screen submits in a single call.
 */
export const createCompositeBatchSchema = z.object({
  name: z.string().trim().min(1, "Batch name is required").max(120),
  classId: objectId,
  gender: z.enum(["MALE", "FEMALE", "COMBINED"]),
  medium: z.enum(["BANGLA", "ENGLISH"]),
  batchNumber: z.number().int().min(1),
  subjects: z.array(subjectRowSchema).min(1, "Add at least one subject to this batch"),
});

export type CreateCompositeBatchInput = z.infer<typeof createCompositeBatchSchema>;

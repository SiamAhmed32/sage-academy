import { z } from "zod";

const objectId = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

/* ---------------------------------- Class --------------------------------- */

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required").max(60),
  orderIndex: z.number().int().min(0).optional().default(0),
  // The real grade number (1-12) legacy billing/routine/student records use.
  // For a grade like "SSC" this is the class number it corresponds to (e.g. 10).
  legacyClassLevel: z.number().int().min(1).max(12),
  isActive: z.boolean().optional().default(true),
});

export const updateClassSchema = createClassSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required for update" }
);

/* --------------------------------- Subject --------------------------------- */

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required").max(80),
  code: z.string().trim().max(20).optional().default(""),
  classId: objectId,
  baseMonthlyFee: z.number().min(0),
  isActive: z.boolean().optional().default(true),
});

export const updateSubjectSchema = createSubjectSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required for update" }
);

/* ------------------------------- BatchGroup -------------------------------- */

export const createBatchGroupSchema = z.object({
  name: z.string().trim().min(1, "Batch group name is required").max(120),
  classId: objectId,
  gender: z.enum(["MALE", "FEMALE", "COMBINED"]),
  medium: z.enum(["BANGLA", "ENGLISH"]),
  batchNumber: z.number().int().min(1),
  // Optional: subjects to spin up as SubjectBatch slots immediately.
  subjectBatches: z
    .array(
      z.object({
        subjectId: objectId,
        teacherId: objectId.optional().or(z.literal("")).default(""),
        maxSeats: z.number().int().min(1).optional().default(30),
        monthlyFee: z.number().min(0).optional(),
      })
    )
    .optional()
    .default([]),
});

export const updateBatchGroupSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    gender: z.enum(["MALE", "FEMALE", "COMBINED"]).optional(),
    medium: z.enum(["BANGLA", "ENGLISH"]).optional(),
    batchNumber: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

/* ------------------------------- SubjectBatch ------------------------------ */

export const createSubjectBatchSchema = z.object({
  batchGroupId: objectId,
  subjectId: objectId,
  teacherId: objectId.optional().or(z.literal("")).default(""),
  maxSeats: z.number().int().min(1).optional().default(30),
  monthlyFee: z.number().min(0).optional(),
});

export const updateSubjectBatchSchema = z
  .object({
    teacherId: objectId.optional().or(z.literal("")),
    maxSeats: z.number().int().min(1).optional(),
    monthlyFee: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

/* --------------------------------- Routine ---------------------------------- */

export const createRoutineSchema = z.object({
  subjectBatchId: objectId,
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

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type CreateBatchGroupInput = z.infer<typeof createBatchGroupSchema>;
export type CreateSubjectBatchInput = z.infer<typeof createSubjectBatchSchema>;

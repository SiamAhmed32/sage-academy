import { z } from "zod";

const requiredText = (field: string) =>
  z.string().trim().min(1, `${field} is required`).max(140);

const optionalText = (max = 500) => z.string().trim().max(max).optional().default("");
const daySchema = z.string().trim().min(1).max(20);

const objectIdOrEmpty = z
  .union([
    z.string().trim().regex(/^[0-9a-fA-F]{24}$/),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((value) => (value ? value : null));

export const admissionStatuses = ["ভর্তি চলছে", "শীঘ্রই শুরু", "ভর্তি বন্ধ"] as const;

const subjectSchema = z.object({
  subjectName: requiredText("Subject name"),
  teacher: objectIdOrEmpty,
  days: z.array(daySchema).min(1, "At least one class day is required").max(7).optional().default([]),
  startTime: requiredText("Start time"),
  endTime: requiredText("End time"),
  monthlyFee: z.number().int().min(0).optional().default(0),
});

export const createAcademicBatchSchema = z.object({
  title: requiredText("Title"),
  batchCode: requiredText("Batch code").regex(/^C(?:[5-9]|1[0-2])[BGC](?:BV|EV)$/), // Adjusted regex to allow 'C' for combined
  classLevel: z.number().int().min(5).max(12),
  genderGroup: z.enum(["male", "female", "combined"]),
  version: z.enum(["bangla", "english"]),
  subjects: z.array(subjectSchema).optional().default([]),
  routineNote: optionalText(1200),
  examSchedule: optionalText(500),
  totalSeats: z.number().int().min(0).optional().default(40),
  availableSeats: z.number().int().min(0).optional().default(40),
  status: z.enum(admissionStatuses).optional().default("ভর্তি চলছে"),
  isActive: z.boolean().optional().default(true),
});

export const updateAcademicBatchSchema = createAcademicBatchSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required for update" }
);

export type CreateAcademicBatchInput = z.infer<typeof createAcademicBatchSchema>;
export type UpdateAcademicBatchInput = z.infer<typeof updateAcademicBatchSchema>;

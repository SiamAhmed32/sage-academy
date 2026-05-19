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

export const createBatchSchema = z.object({
  title: requiredText("Title"),
  slug: requiredText("Slug").regex(/^[a-z0-9-]+$/),
  batchCode: requiredText("Batch code").regex(/^C(?:[5-9]|1[0-2])[BG](?:BV|EV)$/),
  image: optionalText(500),
  shift: optionalText(120),
  classLevel: z.number().int().min(5).max(12),
  genderGroup: z.enum(["male", "female"]),
  version: z.enum(["bangla", "english"]),
  feature1: requiredText("Feature 1"),
  feature2: requiredText("Feature 2"),
  feature3: requiredText("Feature 3"),
  feature4: requiredText("Feature 4"),
  features: z.array(z.string().trim().min(1).max(200)).length(4),
  subjects: z.array(subjectSchema).optional().default([]),
  overview: optionalText(1200),
  status: z.enum(admissionStatuses).optional().default("ভর্তি চলছে"),
  isActive: z.boolean().optional().default(true),
  websiteVisible: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  order: z.number().int().min(0).optional().default(0),
});

export const updateBatchSchema = createBatchSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required for update" }
);

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;

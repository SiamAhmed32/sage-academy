import { z } from "zod";

const requiredText = (field: string) =>
  z.string().trim().min(1, `${field} is required`).max(120, `${field} is too long`);

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

export const createStudentSchema = z.object({
  admissionYear: z.number().int().min(2024).max(2099),
  classLevel: z.number().int().min(1).max(12),
  nameEnglish: requiredText("English name"),
  nameBangla: optionalText(120),
  phone: requiredText("Phone"),
  guardianName: optionalText(120),
  guardianPhone: optionalText(30),
  gender: z.enum(["male", "female", "other"]).optional().default("male"),
  version: z.enum(["bangla", "english", "other"]).optional().default("bangla"),
  batch: z.string().trim().regex(/^[0-9a-fA-F]{24}$/).optional().or(z.literal("")).default(""),
  schoolName: optionalText(160),
  roll: optionalText(40),
  isActive: z.boolean().optional().default(true),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

import { z } from "zod";

const requiredText = (field: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(max, `${field} is too long`);

const optionalText = (max: number) =>
  z.string().trim().max(max, "Value is too long").optional();

export const createTeacherSchema = z.object({
  name: requiredText("Name"),
  subject: requiredText("Subject"),
  designation: optionalText(120).default(""),
  experience: optionalText(120).default(""),
  quote: optionalText(320).default(""),
  image: optionalText(500).default(""),
  isFeatured: z.boolean().optional().default(false),
  order: z.number().int().min(0, "Order cannot be negative").optional().default(0),
});

export const updateTeacherSchema = createTeacherSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export type TeacherPayload = z.infer<typeof createTeacherSchema>;
export type TeacherUpdatePayload = z.infer<typeof updateTeacherSchema>;

import { z } from "zod";

const requiredText = (field: string, max = 320) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(max, `${field} is too long`);

const optionalText = (max: number) =>
  z.string().trim().max(max, "Value is too long").optional();

export const createTestimonialSchema = z.object({
  name: requiredText("Name", 120),
  role: z.enum(["student", "guardian"]).optional().default("student"),
  className: requiredText("Class", 120),
  review: requiredText("Review", 600),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5").optional().default(5),
  image: optionalText(500).default(""),
  isFeatured: z.boolean().optional().default(true),
  order: z.number().int().min(0, "Order cannot be negative").optional().default(0),
});

export const updateTestimonialSchema = createTestimonialSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export type TestimonialPayload = z.infer<typeof createTestimonialSchema>;
export type TestimonialUpdatePayload = z.infer<typeof updateTestimonialSchema>;

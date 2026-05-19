import { z } from "zod";

import { leadAttributionSchema } from "@/schemas/lead-attribution";

const bangladeshPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

export const createContactRequestSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
    phone: z.string().trim().regex(bangladeshPhoneRegex, "Phone number is invalid"),
    message: z
      .string()
      .trim()
      .min(1, "Message is required")
      .max(800, "Message is too long"),
    source: z.string().trim().max(80, "Source is too long").optional().default("home-contact-section"),
    status: z.enum(["new", "contacted", "closed", "spam"]).optional().default("new"),
    isRead: z.boolean().optional().default(false),
    adminNote: z.string().trim().max(800, "Note is too long").optional().default(""),
  })
  .merge(leadAttributionSchema);

export const updateContactRequestSchema = createContactRequestSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export type ContactRequestPayload = z.infer<typeof createContactRequestSchema>;
export type ContactRequestUpdatePayload = z.infer<typeof updateContactRequestSchema>;

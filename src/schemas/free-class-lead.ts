import { z } from "zod";

import { bdPhoneSchema, normalizeBangladeshPhone } from "@/lib/bd-phone";

export { bdPhoneSchema, normalizeBangladeshPhone };

export const freeClassLeadGuestSchema = z.object({
  mode: z.literal("guest"),
  name: z.string().trim().min(2, "নাম লিখুন").max(120, "নাম খুব লম্বা"),
  phone: bdPhoneSchema,
  classLabel: z
    .string()
    .trim()
    .min(1, "শ্রেণী বেছে নিন")
    .max(40, "অবৈধ মান"),
  subject: z.string().trim().min(2, "বিষয় লিখুন").max(120, "বিষয় খুব লম্বা"),
});

export const freeClassLeadRegisteredSchema = z.object({
  mode: z.literal("registered"),
  classLabel: z
    .string()
    .trim()
    .min(1, "শ্রেণী বেছে নিন")
    .max(40, "অবৈধ মান"),
  subject: z.string().trim().min(2, "বিষয় লিখুন").max(120, "বিষয় খুব লম্বা"),
  /** When account has no phone yet */
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? normalizeBangladeshPhone(v) : "")),
});

export type FreeClassLeadGuestInput = z.infer<typeof freeClassLeadGuestSchema>;
export type FreeClassLeadRegisteredInput = z.infer<typeof freeClassLeadRegisteredSchema>;

import { z } from "zod";

import { ENGAGEMENT_EVENT_TYPES } from "@/constants/engagement-events";

export const createEngagementEventSchema = z.object({
  eventType: z.enum(ENGAGEMENT_EVENT_TYPES),
  sessionId: z.string().trim().min(8).max(80),
  path: z.string().trim().max(400).default("/"),
  /** For `cta_click`: e.g. navbar_admission, hero_admission */
  label: z.string().trim().max(120).optional().default(""),
  referrer: z.string().trim().max(600).optional().default(""),
  contactEmail: z.union([z.literal(""), z.string().email()]).default(""),
  contactPhone: z.string().trim().max(20).optional().default(""),
});

export type CreateEngagementEventInput = z.infer<typeof createEngagementEventSchema>;

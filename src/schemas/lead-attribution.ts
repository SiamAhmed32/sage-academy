import { z } from "zod";

const opt = (max: number) =>
  z.string().trim().max(max).optional().default("");

/** First-touch UTM + paths stored on public lead submissions */
export const leadAttributionSchema = z.object({
  utmSource: opt(200),
  utmMedium: opt(200),
  utmCampaign: opt(200),
  utmContent: opt(200),
  utmTerm: opt(200),
  attributionReferrer: opt(500),
  attributionLandingPath: opt(300),
  attributionSubmitPath: opt(300),
  attributionCapturedAt: opt(80),
});

export type LeadAttributionPayload = z.infer<typeof leadAttributionSchema>;

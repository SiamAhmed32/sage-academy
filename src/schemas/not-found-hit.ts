import { z } from "zod";

import { sanitizeRequestPath } from "@/lib/sanitize-request-path";

export const notFoundHitSchema = z.object({
  path: z
    .string()
    .trim()
    .max(400)
    .transform(sanitizeRequestPath),
  referrer: z.string().trim().max(600).optional().default(""),
});

export type NotFoundHitInput = z.infer<typeof notFoundHitSchema>;

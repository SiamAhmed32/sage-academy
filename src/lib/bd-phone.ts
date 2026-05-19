import { z } from "zod";

/** After normalization: 01[3-9] + 8 digits (Bangladesh mobile). */
const NORMALIZED_BD_MOBILE = /^01[3-9]\d{8}$/;

/**
 * Accepts 01..., +8801..., 8801... (spaces/dashes stripped).
 * Returns local form 01xxxxxxxxx or best-effort string for invalid input.
 */
export function normalizeBangladeshPhone(raw: string): string {
  let val = raw.trim().replace(/[\s-]/g, "");
  if (val.startsWith("+880")) {
    val = `0${val.slice(4)}`;
  } else if (val.startsWith("880") && val.length >= 13) {
    val = `0${val.slice(3)}`;
  }
  return val;
}

export function isValidBdMobileNormalized(val: string): boolean {
  return NORMALIZED_BD_MOBILE.test(val);
}

export const bdPhoneSchema = z
  .string()
  .trim()
  .transform(normalizeBangladeshPhone)
  .refine((val) => isValidBdMobileNormalized(val), {
    message: "সঠিক মোবাইল নম্বর দিন (০১ দিয়ে শুরু, অথবা +৮৮০১…)",
  });

/** True if stored value is a valid BD mobile in normalized form. */
export function userHasValidBdPhone(stored: string | null | undefined): boolean {
  if (!stored || typeof stored !== "string") return false;
  return isValidBdMobileNormalized(normalizeBangladeshPhone(stored));
}

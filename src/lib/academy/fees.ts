// Pure fee maths shared by the enrollment form, dues generator and receipts.
import type { DiscountType, Version } from "@/lib/academy/constants";

export type FeeEntry = {
  effectiveFrom: string; // "YYYY-MM"
  bangla: number;
  english: number;
};

/** The fee entry in force for a month: the latest one starting on or before it. */
export function feeEntryForMonth(fees: FeeEntry[], monthKey: string): FeeEntry | null {
  const sorted = [...fees].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  let match: FeeEntry | null = null;
  for (const entry of sorted) {
    if (entry.effectiveFrom <= monthKey) match = entry;
  }
  return match ?? sorted[0] ?? null;
}

export function feeForMonth(fees: FeeEntry[], version: Version, monthKey: string) {
  const entry = feeEntryForMonth(fees, monthKey);
  if (!entry) return 0;
  return version === "english" ? entry.english : entry.bangla;
}

/** A scheduled change that starts after the given month, if any. */
export function upcomingFeeEntry(fees: FeeEntry[], monthKey: string): FeeEntry | null {
  const future = fees
    .filter((entry) => entry.effectiveFrom > monthKey)
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  return future[0] ?? null;
}

export function discountAmount(fee: number, type: DiscountType, value: number) {
  const safeFee = Math.max(0, Number(fee) || 0);
  const safeValue = Math.max(0, Number(value) || 0);
  if (type === "percent") {
    return Math.min(safeFee, Math.round((safeFee * Math.min(100, safeValue)) / 100));
  }
  if (type === "amount") {
    return Math.min(safeFee, Math.round(safeValue));
  }
  return 0;
}

export function netFee(fee: number, type: DiscountType, value: number) {
  return Math.max(0, Math.round(fee) - discountAmount(fee, type, value));
}

export function discountLabel(type: DiscountType, value: number) {
  if (type === "percent" && value > 0) return `${value}%`;
  if (type === "amount" && value > 0) return `৳${Math.round(value).toLocaleString("en-IN")}`;
  return "—";
}

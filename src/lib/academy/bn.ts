// Bangla labels for the student / guardian portal. Numbers stay in western digits.
import type { WeekDay } from "@/lib/academy/constants";

export const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export const BN_DAYS: Record<WeekDay | "fri", string> = {
  sat: "শনিবার",
  sun: "রবিবার",
  mon: "সোমবার",
  tue: "মঙ্গলবার",
  wed: "বুধবার",
  thu: "বৃহস্পতিবার",
  fri: "শুক্রবার",
};

export const BN_DAYS_SHORT: Record<WeekDay, string> = {
  sat: "শনি",
  sun: "রবি",
  mon: "সোম",
  tue: "মঙ্গল",
  wed: "বুধ",
  thu: "বৃহঃ",
};

export function bnMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return `${BN_MONTHS[(month || 1) - 1] ?? ""} ${year}`;
}

export const BN_DUE_KIND: Record<string, string> = {
  tuition: "মাসিক বেতন",
  admission: "ভর্তি ফি",
  materials: "উপকরণ ফি",
  exam: "পরীক্ষা ফি",
  other: "অন্যান্য",
};

export const BN_METHOD: Record<string, string> = {
  cash: "নগদ",
  bkash: "বিকাশ",
  nagad: "নগদ (Nagad)",
  bank: "ব্যাংক",
};

import { monthNames } from "@/lib/month-utils";

export const months = [...monthNames];

export const monthLabels: Record<string, string> = {
  January: "জানুয়ারি",
  February: "ফেব্রুয়ারি",
  March: "মার্চ",
  April: "এপ্রিল",
  May: "মে",
  June: "জুন",
  July: "জুলাই",
  August: "আগস্ট",
  September: "সেপ্টেম্বর",
  October: "অক্টোবর",
  November: "নভেম্বর",
  December: "ডিসেম্বর",
};

export const methodLabels: Record<string, string> = {
  cash: "ক্যাশ",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "ব্যাংক",
  other: "অন্যান্য",
};

/** Latin-only labels for jsPDF (Helvetica cannot render Bengali). */
export const methodLabelsReceiptEn: Record<string, string> = {
  cash: "Cash",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "Bank transfer",
  other: "Other",
};

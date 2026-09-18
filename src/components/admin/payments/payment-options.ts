import { monthNames } from "@/lib/month-utils";

export const months = [...monthNames];

export const monthLabels: Record<string, string> = {
  January: "January",
  February: "February",
  March: "March",
  April: "April",
  May: "May",
  June: "June",
  July: "July",
  August: "August",
  September: "September",
  October: "October",
  November: "November",
  December: "December",
};

export const methodLabels: Record<string, string> = {
  cash: "Cash",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "Bank transfer",
  other: "Other",
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

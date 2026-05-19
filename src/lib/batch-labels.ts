export type BatchGenderGroup = "male" | "female" | "combined";
export type BatchVersion = "bangla" | "english" | "other";

export const batchGenderLabels: Record<BatchGenderGroup, string> = {
  male: "ছেলে",
  female: "মেয়ে",
  combined: "উভয়",
};

export const batchVersionLabels: Record<BatchVersion, string> = {
  bangla: "বাংলা",
  english: "ইংলিশ",
  other: "অন্যান্য",
};

export function formatBatchTime(startTime?: string, endTime?: string) {
  return [startTime, endTime].filter(Boolean).join(" - ") || "সময় দেওয়া হয়নি";
}

export function formatBatchType(genderGroup?: BatchGenderGroup, version?: BatchVersion) {
  return `${batchGenderLabels[genderGroup ?? "combined"]} / ${batchVersionLabels[version ?? "bangla"]}`;
}

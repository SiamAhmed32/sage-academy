import { getClassLabel } from "@/constants/class-levels";

type BatchCodeInput = {
  classLevel: number;
  genderGroup: string;
  version: string;
};

export function buildBatchCode({
  classLevel,
  genderGroup,
  version,
}: BatchCodeInput) {
  const genderCode = genderGroup === "female" ? "G" : "B";
  const versionCode = version === "english" ? "EV" : "BV";

  return `C${classLevel}${genderCode}${versionCode}`;
}

export function buildBatchSlug(batchCode: string) {
  return batchCode.trim().toLowerCase();
}

export function withBatchSlug<T extends { batchCode: string; slug?: string }>(data: T) {
  return {
    ...data,
    slug: data.slug?.trim().toLowerCase() || buildBatchSlug(data.batchCode),
  };
}

export function getBatchTitle(classLevel: number) {
  return getClassLabel(classLevel);
}

export function getBatchAudienceLabel(genderGroup: string, version: string) {
  const genderLabel = genderGroup === "female" ? "মেয়েদের" : "ছেলেদের";
  const versionLabel = version === "english" ? "ইংরেজি ভার্সন" : "বাংলা ভার্সন";

  return `${genderLabel} ${versionLabel} ব্যাচ`;
}

type PublicSlugInput = {
  title?: string | null;
  batchCode?: string | null;
  classLevel?: number | string | null;
  fallback?: string;
};

const banglaDigitMap: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

export function inferClassLevelFromTitle(title?: string | null) {
  if (!title) return "";

  const normalized = title.replace(/[০-৯]/g, (digit) => banglaDigitMap[digit] ?? digit);
  const match = normalized.match(/\b([4-9]|1[0-2])\b/);
  return match?.[1] ?? "";
}

export function buildClassSlug(classLevel?: number | string | null) {
  const normalized = Number(classLevel);
  return Number.isInteger(normalized) && normalized > 0 ? `class-${normalized}` : "";
}

export function buildPublicSlug({
  title,
  batchCode,
  classLevel,
  fallback = "batch",
}: PublicSlugInput) {
  const classSlug = buildClassSlug(classLevel) || buildClassSlug(inferClassLevelFromTitle(title));
  if (classSlug) return classSlug;

  const source = batchCode || title || fallback;
  const slug = source
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

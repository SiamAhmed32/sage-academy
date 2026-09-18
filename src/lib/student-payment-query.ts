export function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeAdminSearch(value: string | undefined, maxLength = 80) {
  return (value ?? "").trim().slice(0, maxLength);
}

export function escapeMongoRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  maximum = 10_000
) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum
    ? parsed
    : fallback;
}

export function parseAllowedInteger(
  value: string | undefined,
  allowed: readonly number[],
  fallback: number
) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return allowed.includes(parsed) ? parsed : fallback;
}

export function parseWhitelistedValue<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T
) {
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseAdminDate(
  value: string | undefined,
  boundary: "start" | "end"
) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day
  ) {
    return undefined;
  }
  const date = new Date(`${value}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}+06:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export type AdminSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function getAdminParam(
  params: AdminSearchParams,
  key: string,
  fallback = ""
) {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? fallback;
}

export function boundedAdminSearch(value: string, maxLength = 100) {
  return value.trim().slice(0, maxLength);
}

export function escapeAdminRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseAdminPage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function parseAdminLimit(
  value: string | undefined,
  allowed: readonly number[],
  fallback: number
) {
  const parsed = Number(value);
  return allowed.includes(parsed) ? parsed : fallback;
}

export function clampAdminPage(page: number, total: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page: Math.min(Math.max(1, page), totalPages),
    totalPages,
  };
}

export function adminDateRangeStart(value: string, now = new Date()) {
  if (value === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (value === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start;
  }
  if (value === "month") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    return start;
  }
  return null;
}

export function pickAdminSort<T extends Record<string, unknown>>(
  value: string,
  allowed: T,
  fallback: keyof T
) {
  return (value in allowed ? allowed[value] : allowed[fallback]) as T[keyof T];
}

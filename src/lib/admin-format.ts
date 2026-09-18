const ADMIN_LOCALE = "en-BD";
const ADMIN_TIME_ZONE = "Asia/Dhaka";

function asDate(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatAdminNumber(value: number) {
  return new Intl.NumberFormat(ADMIN_LOCALE).format(value);
}

export function formatAdminCurrency(value: number) {
  return new Intl.NumberFormat(ADMIN_LOCALE, {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatAdminDate(
  value: Date | string | number | null | undefined,
  fallback = "Not available"
) {
  if (value == null) return fallback;
  const date = asDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat(ADMIN_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: ADMIN_TIME_ZONE,
  }).format(date);
}

export function formatAdminDateTime(
  value: Date | string | number | null | undefined,
  fallback = "Not available"
) {
  if (value == null) return fallback;
  const date = asDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat(ADMIN_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ADMIN_TIME_ZONE,
  }).format(date);
}

export function formatAdminMonth(value: Date | string | number) {
  const date = asDate(value);
  if (!date) return "Not available";
  return new Intl.DateTimeFormat(ADMIN_LOCALE, {
    month: "long",
    year: "numeric",
    timeZone: ADMIN_TIME_ZONE,
  }).format(date);
}

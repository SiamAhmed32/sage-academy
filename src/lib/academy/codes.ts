// Pure helpers for codes, months, money and times. No server imports.
import type { BatchGender, Version } from "@/lib/academy/constants";

/** `06BB01` → class, gender (B/G), version (B/E), batch number. Batches carry over year to year. */
export function formatBatchCode(input: { classLevel: number; gender: BatchGender; version: Version; sequence: number }) {
  const cls = String(input.classLevel).padStart(2, "0");
  const g = input.gender === "girls" ? "G" : "B";
  const v = input.version === "english" ? "E" : "B";
  const seq = String(input.sequence).padStart(2, "0");
  return `${cls}${g}${v}${seq}`;
}

export function batchCounterKey(input: { classLevel: number; gender: BatchGender; version: Version }) {
  return `batch:${input.classLevel}:${input.gender}:${input.version}`;
}

/**
 * `2605001` → admitted in 2026, into Class 05, student 001 of that class and year.
 * The class is the admission class and never changes, even after promotion.
 */
export function formatStudentId(year: number, classLevel: number, serial: number) {
  return `${String(year % 100).padStart(2, "0")}${String(classLevel).padStart(2, "0")}${String(serial).padStart(3, "0")}`;
}

/** `R260500101` → R + student ID + that student's receipt number (01, 02… 100 just grows). */
export function formatReceiptNo(studentId: string, serial: number) {
  return `R${studentId}${String(serial).padStart(2, "0")}`;
}

export function batchLabel(input: {
  classLevel: number;
  gender: BatchGender;
  version: Version;
  sequence: number;
}) {
  return `Class ${input.classLevel} · ${input.gender === "girls" ? "Girls" : "Boys"} · ${
    input.version === "english" ? "English" : "Bangla"
  } · Batch ${input.sequence}`;
}

// ---------- Months (all in Asia/Dhaka) ----------

const DHAKA = "Asia/Dhaka";

export function dhakaParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: get("weekday").toLowerCase().slice(0, 3),
  };
}

/** "YYYY-MM" for the current Dhaka month. */
export function currentMonthKey(date = new Date()) {
  const { year, month } = dhakaParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function addMonths(monthKey: string, count: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const index = year * 12 + (month - 1) + count;
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

export function monthRange(from: string, to: string) {
  const months: string[] = [];
  let cursor = from;
  while (cursor <= to && months.length < 240) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return months;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthLabel(monthKey: string, short = false) {
  const [year, month] = monthKey.split("-").map(Number);
  const name = MONTH_NAMES[(month || 1) - 1] ?? "";
  return `${short ? name.slice(0, 3) : name} ${year}`;
}

export function isMonthKey(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

// ---------- Money ----------

export function formatTaka(value: number) {
  const rounded = Math.round(Number(value) || 0);
  return `৳${rounded.toLocaleString("en-IN")}`;
}

// ---------- Times ----------

export function isTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatTime(value: string) {
  if (!isTime(value)) return value;
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(start: string, end: string) {
  return `${formatTime(start).replace(/^0/, "")} – ${formatTime(end).replace(/^0/, "")}`;
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: DHAKA,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Minutes since midnight, Dhaka time. */
export function dhakaNowMinutes(date = new Date()) {
  const [hours, minutes] = new Intl.DateTimeFormat("en-GB", {
    timeZone: DHAKA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .split(":")
    .map(Number);
  return (hours % 24) * 60 + minutes;
}

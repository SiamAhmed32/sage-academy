import type { ClassRoutineEntry } from "@/lib/class-routine-types";
import type { RoutineItem } from "@/components/admin/students/profile/types";

export type StudentRoutinePdfMeta = {
  studentName: string;
  studentId: string;
  batchTitle?: string;
  batchCode?: string;
  classLevel?: number;
  routineNote?: string;
};

export function routineItemsToPaperEntries(items: RoutineItem[]): ClassRoutineEntry[] {
  return items.map((item) => ({
    day: item.day,
    time: formatRoutineTimeRange(item.startTime, item.endTime),
    subject: item.subjectName,
  }));
}

export function countWeeklyClasses(items: RoutineItem[] | ClassRoutineEntry[]) {
  return items.length;
}

export function formatRoutineTimeRange(startTime: string, endTime: string) {
  const start = compactRoutineClock(startTime);
  const end = compactRoutineClock(endTime);
  if (!start || !end) return `${startTime} - ${endTime}`.trim();

  const startMeridiem = start.slice(-2);
  const endMeridiem = end.slice(-2);
  if (startMeridiem === endMeridiem && (startMeridiem === "am" || startMeridiem === "pm")) {
    return `${start.slice(0, -2)}-${end.slice(0, -2)}${startMeridiem}`;
  }
  return `${start}-${end}`;
}

function toHours24(hour: number, meridiem?: string) {
  if (meridiem === "PM") return hour < 12 ? hour + 12 : hour;
  if (meridiem === "AM") return hour === 12 ? 0 : hour;
  if (hour >= 13) return hour;
  if (hour >= 7 && hour <= 11) return hour;
  if (hour === 12) return 12;
  if (hour >= 1 && hour <= 6) return hour + 12;
  return hour;
}

function compactRoutineClock(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return trimmed.replace(/:/g, ".").replace(/\s+/g, "");

  const hour = Number(match[1]);
  const minutes = match[2];
  const explicitMeridiem = match[3]?.toUpperCase();
  const hours24 = toHours24(hour, explicitMeridiem);

  const meridiem = hours24 >= 12 ? "pm" : "am";
  let displayHours = hours24 % 12;
  if (displayHours === 0) displayHours = 12;

  const clock = minutes === "00" ? String(displayHours) : `${displayHours}.${minutes}`;
  return `${clock}${meridiem}`;
}

export function buildStudentRoutinePdfMeta(meta: StudentRoutinePdfMeta) {
  const batchLabel = [meta.batchTitle, meta.batchCode ? `Batch: ${meta.batchCode}` : ""]
    .filter(Boolean)
    .join(" · ");

  const title =
    meta.batchTitle?.trim() ||
    (meta.classLevel ? `SSC / Class ${meta.classLevel}` : "Academic Batch");

  const subtitle =
    meta.batchCode?.trim()
      ? `Batch: ${meta.batchCode}`
      : batchLabel && batchLabel !== title
        ? batchLabel
        : undefined;
  const studentLine = `${meta.studentName}${meta.studentId ? ` - ID: ${meta.studentId}` : ""}`;
  const footer = meta.routineNote?.trim() || undefined;

  const filenameBase = [meta.batchCode, meta.studentId, "routine"]
    .filter(Boolean)
    .join("-")
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  return {
    title,
    subtitle: subtitle && subtitle !== title ? subtitle : meta.batchCode ? `Batch: ${meta.batchCode}` : undefined,
    studentLine,
    footer,
    filename: `${filenameBase || "class-routine"}.pdf`,
  };
}

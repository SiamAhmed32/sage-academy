import jsPDF from "jspdf";

import type { ClassRoutineEntry, ClassRoutinePdfOptions } from "@/lib/class-routine-types";
import { routineDayPairs } from "@/lib/routine-utils";

export type { ClassRoutineEntry, ClassRoutinePdfOptions } from "@/lib/class-routine-types";

const WEEK_DAYS_EN = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

const INK: [number, number, number] = [0, 0, 0];
const HATCH: [number, number, number] = [225, 225, 225];

function dayKey(value: string) {
  const bn = routineDayPairs.find((day) => day.bn === value)?.en;
  if (bn) return bn;
  const en = routineDayPairs.find((day) => day.en === value)?.en;
  if (en) return en;
  return value;
}

function sortByTime(a: ClassRoutineEntry, b: ClassRoutineEntry) {
  const parsedA = Date.parse(`January 1, 2000 ${a.time.split("-")[0]?.trim() || a.time}`);
  const parsedB = Date.parse(`January 1, 2000 ${b.time.split("-")[0]?.trim() || b.time}`);
  return (Number.isNaN(parsedA) ? 0 : parsedA) - (Number.isNaN(parsedB) ? 0 : parsedB);
}

function entriesForDay(entries: ClassRoutineEntry[], dayEn: string) {
  const dayBn = routineDayPairs.find((day) => day.en === dayEn)?.bn;
  return entries
    .filter((entry) => dayKey(entry.day) === dayEn || entry.day === dayBn)
    .sort(sortByTime);
}

/** jsPDF Helvetica cannot render Bengali — keep PDF text Latin-safe. */
export function pdfSafeText(value?: string, fallback = "") {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return fallback;
  if (/[^\x20-\x7E]/.test(trimmed)) {
    const ascii = trimmed.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
    return ascii || fallback;
  }
  return trimmed;
}

function drawHatch(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFillColor(...HATCH);
  doc.rect(x + 1.5, y + 1.5, w - 3, h - 3, "F");
}

function drawCellBorder(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(...INK);
  doc.setLineWidth(1.2);
  doc.rect(x, y, w, h);
}

function drawCenteredText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  w: number,
  fontSize: number,
  bold = false
) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...INK);
  const lines = doc.splitTextToSize(text, w - 8);
  const rows = Array.isArray(lines) ? lines : [lines];
  const lineHeight = fontSize + 2;
  let cursor = y + lineHeight;
  for (const row of rows) {
    doc.text(String(row), x + w / 2, cursor, { align: "center" });
    cursor += lineHeight;
  }
}

function drawCenteredInBox(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  bold = false
) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...INK);
  const lines = doc.splitTextToSize(text, w - 8);
  const rows = Array.isArray(lines) ? lines : [lines];
  const lineHeight = fontSize + 2;
  const blockH = rows.length * lineHeight;
  let cursor = y + Math.max(8, (h - blockH) / 2 + fontSize);
  for (const row of rows) {
    doc.text(String(row), x + w / 2, cursor, { align: "center" });
    cursor += lineHeight;
  }
}

function drawLeftInBox(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  bold = false
) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...INK);
  const lines = doc.splitTextToSize(text, w - 12);
  const rows = Array.isArray(lines) ? lines : [lines];
  const lineHeight = fontSize + 2;
  const blockH = rows.length * lineHeight;
  let cursor = y + Math.max(10, (h - blockH) / 2 + fontSize);
  for (const row of rows) {
    doc.text(String(row), x + 10, cursor, { align: "left" });
    cursor += lineHeight;
  }
}

const MIN_SLOT_COLUMNS = 4;
const MAX_SLOT_COLUMNS = 6;

/** Paper layout: day on left, fixed slot columns, time row + subject row per day. */
function drawWeeklyRowsRoutine(
  doc: jsPDF,
  entries: ClassRoutineEntry[],
  footer: string | undefined,
  startY: number,
  pageW: number,
  margin: number
) {
  const tableW = pageW - margin * 2;
  const dayColW = 86;
  const timeRowH = 24;
  const subjectRowH = 28;
  const dayBlockH = timeRowH + subjectRowH;

  const dayRows = WEEK_DAYS_EN.map((day) => entriesForDay(entries, day));
  const busiestDay = Math.max(0, ...dayRows.map((row) => row.length));
  const slotCount = Math.min(MAX_SLOT_COLUMNS, Math.max(MIN_SLOT_COLUMNS, busiestDay));
  const slotColW = (tableW - dayColW) / slotCount;

  let y = startY;

  for (let dayIndex = 0; dayIndex < WEEK_DAYS_EN.length; dayIndex += 1) {
    const day = WEEK_DAYS_EN[dayIndex];
    const dayEntries = dayRows[dayIndex];

    drawCellBorder(doc, margin, y, dayColW, dayBlockH);
    drawLeftInBox(doc, day, margin, y, dayColW, dayBlockH, 11, true);

    for (let slot = 0; slot < slotCount; slot += 1) {
      const x = margin + dayColW + slot * slotColW;
      const entry = dayEntries[slot];

      drawCellBorder(doc, x, y, slotColW, timeRowH);
      if (entry) {
        drawCenteredText(doc, pdfSafeText(entry.time, ""), x, y + 2, slotColW, 9, false);
      }

      drawCellBorder(doc, x, y + timeRowH, slotColW, subjectRowH);
      if (entry) {
        drawHatch(doc, x, y + timeRowH, slotColW, subjectRowH);
        drawCenteredText(
          doc,
          pdfSafeText(entry.subject, "Subject"),
          x,
          y + timeRowH + 4,
          slotColW,
          9,
          true
        );
      } else {
        drawHatch(doc, x, y + timeRowH, slotColW, subjectRowH);
      }
    }

    y += dayBlockH;
  }

  if (footer) {
    drawCellBorder(doc, margin, y, tableW, 34);
    drawCenteredText(doc, footer, margin, y + 6, tableW, 10, true);
  }
}

function savePdfDocument(doc: jsPDF, filename: string) {
  try {
    doc.save(filename);
    return;
  } catch {
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Build and download the official weekly class routine PDF. */
export function downloadClassRoutinePdf(options: ClassRoutinePdfOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 36;

  const title = pdfSafeText(options.title, "Class Routine");
  const subtitle = pdfSafeText(options.subtitle, "");
  const studentLine = pdfSafeText(options.studentLine, "");
  const classCountLine = pdfSafeText(options.classCountLine, "");
  const footer = options.footer ? pdfSafeText(options.footer, "") : undefined;

  let y = 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...INK);
  doc.text("Class Routine", pageW / 2, y, { align: "center" });
  y += 28;

  doc.setFontSize(18);
  doc.text(title, pageW / 2, y, { align: "center" });
  y += 22;

  if (subtitle) {
    doc.setFontSize(15);
    doc.text(subtitle, pageW / 2, y, { align: "center" });
    y += 20;
  }

  if (studentLine) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(studentLine, pageW / 2, y, { align: "center" });
    y += 18;
  }

  if (classCountLine) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(classCountLine, pageW / 2, y, { align: "center" });
    y += 20;
  } else {
    y += 6;
  }

  drawWeeklyRowsRoutine(doc, options.entries, footer, y, pageW, margin);
  savePdfDocument(doc, options.filename);
}

/** @deprecated Use downloadClassRoutinePdf */
export async function generateClassRoutinePdf(options: ClassRoutinePdfOptions) {
  downloadClassRoutinePdf(options);
}

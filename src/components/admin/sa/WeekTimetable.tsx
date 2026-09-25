"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";

import { WEEK_DAYS, WEEK_DAY_LABELS, type WeekDay } from "@/lib/academy/constants";
import { dhakaParts, formatTime, formatTimeRange, timeToMinutes } from "@/lib/academy/codes";
import { exportElementToPdf } from "@/components/admin/sa/export-pdf";

export type TimetableSlot = {
  key: string;
  day: WeekDay;
  start: string;
  end: string;
  subject: string;
  /** e.g. "06BB01 · Room 201" */
  meta: string;
  teacher?: string;
  tone: 1 | 2 | 3 | 4 | 5;
  href?: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const JS_DAY_INDEX: Record<string, number> = { sat: 0, sun: 1, mon: 2, tue: 3, wed: 4, thu: 5, fri: 6 };

/** Saturday (UTC midnight) of the SAGE week containing today in Dhaka. Friday rolls to next week. */
function currentWeekStart() {
  const today = dhakaParts();
  const base = Date.UTC(today.year, today.month - 1, today.day);
  const offset = JS_DAY_INDEX[today.weekday] ?? 0;
  const saturday = base - offset * 86_400_000;
  return offset === 6 ? saturday + 7 * 86_400_000 : saturday;
}

function todayUtc() {
  const today = dhakaParts();
  return Date.UTC(today.year, today.month - 1, today.day);
}

function weekLabel(start: number) {
  const first = new Date(start);
  const last = new Date(start + 5 * 86_400_000);
  const sameMonth = first.getUTCMonth() === last.getUTCMonth();
  if (sameMonth) {
    return `${first.getUTCDate()}–${last.getUTCDate()} ${MONTHS_LONG[first.getUTCMonth()]} ${first.getUTCFullYear()}`;
  }
  return `${first.getUTCDate()} ${MONTHS[first.getUTCMonth()]} – ${last.getUTCDate()} ${MONTHS[last.getUTCMonth()]} ${last.getUTCFullYear()}`;
}

export function WeekTimetable({
  slots,
  exportName,
  emptyText = "No classes are scheduled yet.",
  id,
  embedded = false,
}: {
  slots: TimetableSlot[];
  exportName?: string;
  emptyText?: string;
  id?: string;
  /** Render inside another card (e.g. a profile tab) without its own panel frame. */
  embedded?: boolean;
}) {
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [exporting, setExporting] = useState(false);
  const today = todayUtc();

  const rows = useMemo(() => {
    const starts = Array.from(new Set(slots.map((slot) => slot.start))).sort(
      (a, b) => timeToMinutes(a) - timeToMinutes(b)
    );
    return starts.map((start) => ({
      start,
      cells: WEEK_DAYS.map((day) =>
        slots
          .filter((slot) => slot.day === day && slot.start === start)
          .sort((a, b) => a.subject.localeCompare(b.subject))
      ),
    }));
  }, [slots]);

  const days = WEEK_DAYS.map((day, index) => {
    const date = weekStart + index * 86_400_000;
    const value = new Date(date);
    return {
      day,
      label: `${value.getUTCDate()} ${MONTHS[value.getUTCMonth()]}`,
      isToday: date === today,
    };
  });

  async function handleExport() {
    const element = document.getElementById(`${id ?? "timetable"}-grid`);
    if (!element) return;
    setExporting(true);
    try {
      await exportElementToPdf(element, exportName ?? "routine", { orientation: "landscape" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className={embedded ? "timetable-panel embedded" : "panel timetable-panel"} id={id}>
      <div className="week-head">
        <div>
          <button
            type="button"
            className="week-arrow"
            onClick={() => setWeekStart((value) => value - 7 * 86_400_000)}
            aria-label="Previous week"
          >
            ‹
          </button>
          <strong>{weekLabel(weekStart)}</strong>
          <button
            type="button"
            className="week-arrow"
            onClick={() => setWeekStart((value) => value + 7 * 86_400_000)}
            aria-label="Next week"
          >
            ›
          </button>
        </div>
        <div>
          {exportName ? (
            <button type="button" className="btn-secondary" onClick={handleExport} disabled={exporting}>
              <Download size={17} />
              {exporting ? "Exporting..." : "Export"}
            </button>
          ) : null}
          <button type="button" className="btn-secondary" onClick={() => setWeekStart(currentWeekStart())}>
            Today
          </button>
        </div>
      </div>

      <div className="week-grid" id={`${id ?? "timetable"}-grid`}>
        <span />
        {days.map((day) => (
          <b key={day.day} className={day.isToday ? "today" : undefined}>
            {WEEK_DAY_LABELS[day.day]}
            <small>{day.label}</small>
          </b>
        ))}
        {rows.length === 0 ? <div className="week-empty">{emptyText}</div> : null}
        {rows.map((row) => (
          <div className="week-row" key={row.start}>
            <span>{formatTime(row.start)}</span>
            {row.cells.map((cell, index) => (
              <div key={WEEK_DAYS[index]} className={days[index].isToday ? "today" : undefined}>
                {cell.map((slot) => {
                  const body = (
                    <>
                      <b>{slot.subject}</b>
                      <small>{slot.meta}</small>
                      <small>
                        {formatTimeRange(slot.start, slot.end)}
                        {slot.teacher ? ` · ${slot.teacher}` : ""}
                      </small>
                    </>
                  );
                  return slot.href ? (
                    <Link key={slot.key} href={slot.href} className={`slot tone-${slot.tone}`}>
                      {body}
                    </Link>
                  ) : (
                    <article key={slot.key} className={`slot tone-${slot.tone}`}>
                      {body}
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

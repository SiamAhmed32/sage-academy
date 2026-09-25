"use client";

import { forwardRef, useMemo } from "react";

import { ACADEMY_CONTACT, WEEK_DAYS, WEEK_DAY_LABELS, type WeekDay } from "@/lib/academy/constants";
import { formatDate, formatTime, formatTimeRange, timeToMinutes } from "@/lib/academy/codes";

export type RoutineSheetInfo = { label: string; value: string }[];

export type RoutineSheetSlot = {
  key: string;
  day: WeekDay;
  start: string;
  end: string;
  title: string;
  /** e.g. "05BB01 · Room 201 · Jewel Ahmed" */
  sub?: string;
  tone: 1 | 2 | 3 | 4 | 5;
};

/**
 * The printable weekly routine (student, teacher, batch, room). One row per
 * class start time — only the times that actually have a class — Saturday to
 * Thursday, under a SAGE header and a labelled details block. Kept off-screen;
 * exports draw it with html-to-image, so Bangla prints correctly.
 */
export const RoutineSheet = forwardRef<HTMLDivElement, { info: RoutineSheetInfo; slots: RoutineSheetSlot[]; heading?: string }>(
  function RoutineSheet({ info, slots, heading = "Class Routine" }, ref) {
    const rows = useMemo(() => {
      const starts = Array.from(new Set(slots.map((slot) => slot.start))).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
      return starts.map((start) => ({
        start,
        cells: WEEK_DAYS.map((day) =>
          slots.filter((slot) => slot.day === day && slot.start === start).sort((a, b) => a.title.localeCompare(b.title))
        ),
      }));
    }, [slots]);

    return (
      <div className="routine-sheet-host" aria-hidden="true">
        <div className="routine-sheet" ref={ref}>
          <header className="routine-sheet-head">
            <div className="routine-sheet-brand">
              {/* eslint-disable-next-line @next/next/no-img-element -- drawn into the export, needs a plain <img> */}
              <img src="/sage-wordmark.png" alt="SAGE" />
              <div>
                <strong>{ACADEMY_CONTACT.name}</strong>
                <span>{ACADEMY_CONTACT.address}</span>
                <span>
                  {ACADEMY_CONTACT.phones.join(" · ")} · {ACADEMY_CONTACT.email}
                </span>
              </div>
            </div>
            <div className="routine-sheet-title">
              <h1>{heading}</h1>
              <span>Weekly · Saturday to Thursday</span>
            </div>
          </header>

          {info.length ? (
            <dl className="routine-sheet-info">
              {info.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value || "—"}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="week-grid routine-sheet-grid">
            <span />
            {WEEK_DAYS.map((day) => (
              <b key={day}>{WEEK_DAY_LABELS[day]}</b>
            ))}
            {rows.length === 0 ? <div className="week-empty">No classes scheduled.</div> : null}
            {rows.map((row) => (
              <div className="week-row" key={row.start}>
                <span>{formatTime(row.start).replace(/^0/, "")}</span>
                {row.cells.map((cell, index) => (
                  <div key={WEEK_DAYS[index]}>
                    {cell.map((slot) => (
                      <article key={slot.key} className={`slot tone-${slot.tone}`}>
                        <b>{slot.title}</b>
                        <small>{formatTimeRange(slot.start, slot.end)}</small>
                        {slot.sub ? <small>{slot.sub}</small> : null}
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <footer className="routine-sheet-foot">
            <span>
              {slots.length} class{slots.length === 1 ? "" : "es"} per week
            </span>
            <span>Printed {formatDate(new Date().toISOString())}</span>
          </footer>
        </div>
      </div>
    );
  }
);

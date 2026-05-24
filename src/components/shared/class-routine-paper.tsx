"use client";

import { Fragment, useMemo, type CSSProperties } from "react";

import type { ClassRoutineEntry } from "@/lib/class-routine-types";
import { routineDayPairs } from "@/lib/routine-utils";

export type { ClassRoutineEntry } from "@/lib/class-routine-types";

export type ClassRoutinePaperProps = {
  title: string;
  subtitle?: string;
  studentLine?: string;
  footer?: string;
  entries: ClassRoutineEntry[];
  layout?: "weekly-rows" | "grid";
};

const WEEK_DAYS_EN = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

const MIN_SLOT_COLUMNS = 4;
const MAX_SLOT_COLUMNS = 6;

const hatchStyle: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0, rgba(0,0,0,.12) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0, rgba(0,0,0,.12) 1px, transparent 1px, transparent 4px)",
};

function dayKey(value: string) {
  const bn = routineDayPairs.find((day) => day.bn === value)?.en;
  if (bn) return bn;
  const en = routineDayPairs.find((day) => day.en === value)?.en;
  if (en) return en;
  return value;
}

function entriesForDay(entries: ClassRoutineEntry[], dayEn: string) {
  const dayBn = routineDayPairs.find((day) => day.en === dayEn)?.bn;
  return entries
    .filter((entry) => dayKey(entry.day) === dayEn || entry.day === dayBn)
    .sort((a, b) => {
      const parsedA = Date.parse(`January 1, 2000 ${a.time.split("-")[0]?.trim() || a.time}`);
      const parsedB = Date.parse(`January 1, 2000 ${b.time.split("-")[0]?.trim() || b.time}`);
      return (Number.isNaN(parsedA) ? 0 : parsedA) - (Number.isNaN(parsedB) ? 0 : parsedB);
    });
}

function EmptySubjectCell() {
  return <div className="min-h-[28px]" style={hatchStyle} />;
}

function WeeklyRowsTable({ entries, footer }: { entries: ClassRoutineEntry[]; footer?: string }) {
  const dayRows = useMemo(
    () => WEEK_DAYS_EN.map((day) => entriesForDay(entries, day)),
    [entries]
  );
  const slotCount = useMemo(() => {
    const busiestDay = Math.max(0, ...dayRows.map((row) => row.length));
    return Math.min(MAX_SLOT_COLUMNS, Math.max(MIN_SLOT_COLUMNS, busiestDay));
  }, [dayRows]);

  return (
    <table className="w-full min-w-[980px] border-collapse table-fixed text-center font-sans text-black">
      <tbody>
        {WEEK_DAYS_EN.map((day, dayIndex) => (
          <Fragment key={day}>
            <tr key={`${day}-time`}>
              <th
                rowSpan={2}
                className="w-28 border-2 border-black bg-white p-2.5 text-left align-middle text-base font-black text-black"
              >
                {day}
              </th>
              {Array.from({ length: slotCount }).map((_, slotIndex) => {
                const entry = dayRows[dayIndex][slotIndex];
                return (
                  <td
                    key={`${day}-time-${slotIndex}`}
                    className="border-2 border-black bg-white p-0 align-middle text-[13px] font-bold"
                  >
                    <div className="flex min-h-[28px] items-center justify-center px-1 py-2">
                      {entry?.time ?? ""}
                    </div>
                  </td>
                );
              })}
            </tr>
            <tr key={`${day}-subject`}>
              {Array.from({ length: slotCount }).map((_, slotIndex) => {
                const entry = dayRows[dayIndex][slotIndex];
                return (
                  <td key={`${day}-subject-${slotIndex}`} className="border-2 border-black p-0 align-middle">
                    {entry ? (
                      <div
                        className="flex min-h-[28px] items-center justify-center px-1 py-2 text-[13px] font-black"
                        style={hatchStyle}
                      >
                        {entry.subject}
                      </div>
                    ) : (
                      <EmptySubjectCell />
                    )}
                  </td>
                );
              })}
            </tr>
          </Fragment>
        ))}
        {footer ? (
          <tr>
            <td
              colSpan={slotCount + 1}
              className="border-2 border-black bg-white p-4 text-center text-base font-black text-black"
            >
              {footer}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function orderedTimes(entries: ClassRoutineEntry[]) {
  return [...new Set(entries.map((entry) => entry.time))].sort((a, b) => {
    const parsedA = Date.parse(`January 1, 2000 ${a.split("-")[0]?.trim() || a}`);
    const parsedB = Date.parse(`January 1, 2000 ${b.split("-")[0]?.trim() || b}`);
    return (Number.isNaN(parsedA) ? 0 : parsedA) - (Number.isNaN(parsedB) ? 0 : parsedB);
  });
}

function GridTable({ entries, footer }: { entries: ClassRoutineEntry[]; footer?: string }) {
  const days = useMemo(() => {
    const unique = [...new Set(entries.map((entry) => dayKey(entry.day)))];
    return WEEK_DAYS_EN.filter((day) => unique.includes(day));
  }, [entries]);
  const times = useMemo(() => orderedTimes(entries), [entries]);

  return (
    <table className="w-full min-w-[760px] border-collapse table-fixed text-center font-sans text-[15px] text-black">
      <tbody>
        {days.map((day) => (
          <tr key={day}>
            <th className="w-32 border-2 border-black bg-white p-3 text-left text-lg font-black text-black">
              {day}
            </th>
            {times.map((time) => {
              const entry = entries.find(
                (item) => dayKey(item.day) === day && item.time === time
              );
              return (
                <td key={`${day}-${time}`} className="border-2 border-black p-0 align-stretch">
                  {entry ? (
                    <div className="grid min-h-[68px] grid-rows-[0.42fr_0.58fr]">
                      <div className="flex items-center justify-center border-b-2 border-black bg-white px-1 py-2 text-[13px] font-bold">
                        {entry.time}
                      </div>
                      <div
                        className="flex items-center justify-center px-1 py-2 text-[13px] font-black"
                        style={hatchStyle}
                      >
                        {entry.subject}
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[74px]" />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
        {footer ? (
          <tr>
            <td
              colSpan={times.length + 1}
              className="border-2 border-black bg-white p-4 text-center text-lg font-black text-black"
            >
              {footer}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

export function ClassRoutinePaper({
  title,
  subtitle,
  studentLine,
  footer,
  entries,
  layout = "weekly-rows",
}: ClassRoutinePaperProps) {
  return (
    <div className="bg-white p-6 text-black" data-routine-paper>
      <div className="mb-5 text-center font-sans text-black">
        <h3 className="text-4xl font-black leading-none tracking-normal text-black">Class Routine</h3>
        <p className="mt-3 text-2xl font-black leading-tight text-black">{title}</p>
        {subtitle ? <p className="mt-1 text-xl font-black leading-tight text-black">{subtitle}</p> : null}
        {studentLine ? (
          <p className="mt-1 text-lg font-bold leading-tight text-black">{studentLine}</p>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        {layout === "grid" ? (
          <GridTable entries={entries} footer={footer} />
        ) : (
          <WeeklyRowsTable entries={entries} footer={footer} />
        )}
      </div>
    </div>
  );
}

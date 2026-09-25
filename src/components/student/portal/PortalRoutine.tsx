"use client";

import { useState } from "react";

import { ScheduleBoard } from "@/components/admin/sa/ScheduleBoard";
import { WeekTimetable } from "@/components/admin/sa/WeekTimetable";
import { WEEK_DAYS, subjectTone, type WeekDay } from "@/lib/academy/constants";
import { BN_DAYS, BN_DAYS_SHORT } from "@/lib/academy/bn";

export type PortalSlot = {
  id: string;
  day: WeekDay;
  start: string;
  end: string;
  room: string;
  subjectName: string;
  batchCode: string;
  teacherName: string;
};

export function PortalRoutine({
  slots,
  today,
  nowMinutes,
  exportName,
}: {
  slots: PortalSlot[];
  today: WeekDay | "fri";
  nowMinutes: number;
  exportName: string;
}) {
  const [view, setView] = useState<"week" | "day">("week");
  const [day, setDay] = useState<WeekDay>(today === "fri" ? "sat" : today);

  return (
    <>
      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="table-toolbar" style={{ borderBottom: 0 }}>
          <strong style={{ fontSize: 15 }}>সাপ্তাহিক রুটিন</strong>
          <span className="cell-sub" style={{ marginTop: 0 }}>
            শনিবার থেকে বৃহস্পতিবার · শুক্রবার ছুটি
          </span>
          <span className="toolbar-spacer" />
          <div className="segmented" role="tablist" aria-label="View">
            <button type="button" className={view === "week" ? "active" : ""} onClick={() => setView("week")}>
              সপ্তাহ
            </button>
            <button type="button" className={view === "day" ? "active" : ""} onClick={() => setView("day")}>
              দিন
            </button>
          </div>
        </div>
      </section>

      {view === "day" ? (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>
                {BN_DAYS[day]}
                {day === today ? " · আজ" : ""}
              </h2>
              <p>এই দিনের সব ক্লাস, সময় অনুযায়ী।</p>
            </div>
            <div className="segmented" role="tablist" aria-label="Day">
              {WEEK_DAYS.map((value) => (
                <button key={value} type="button" className={day === value ? "active" : ""} onClick={() => setDay(value)}>
                  {BN_DAYS_SHORT[value]}
                </button>
              ))}
            </div>
          </div>
          <ScheduleBoard
            nowMinutes={day === today ? nowMinutes : -1}
            emptyText="এই দিনে কোনো ক্লাস নেই।"
            classes={slots
              .filter((slot) => slot.day === day)
              .map((slot) => ({
                key: `${slot.batchCode}-${slot.id}`,
                start: slot.start,
                end: slot.end,
                subject: slot.subjectName,
                meta: [slot.room ? `রুম ${slot.room}` : "", slot.teacherName].filter(Boolean).join(" · "),
                tone: subjectTone(slot.subjectName),
              }))}
          />
        </section>
      ) : (
        <WeekTimetable
          id="portal-routine"
          exportName={exportName}
          emptyText="রুটিন এখনো দেওয়া হয়নি।"
          slots={slots.map((slot) => ({
            key: `${slot.batchCode}-${slot.id}`,
            day: slot.day,
            start: slot.start,
            end: slot.end,
            subject: slot.subjectName,
            meta: [slot.batchCode, slot.room ? `Room ${slot.room}` : ""].filter(Boolean).join(" · "),
            teacher: slot.teacherName,
            tone: subjectTone(slot.subjectName),
          }))}
        />
      )}
    </>
  );
}

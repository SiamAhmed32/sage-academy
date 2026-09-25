"use client";

import { useMemo, useState } from "react";

import { ScheduleBoard } from "@/components/admin/sa/ScheduleBoard";
import { RoutineToolbar, RoutineWeek, useRoutineSettings } from "@/components/admin/sa/RoutineWeek";
import { WEEK_DAYS, WEEK_DAY_LABELS, subjectTone, type WeekDay } from "@/lib/academy/constants";

export type TimetableSource = {
  id: string;
  batchId: string;
  batchCode: string;
  classLevel: number;
  subjectName: string;
  teacherId: string | null;
  teacherName: string;
  day: WeekDay;
  start: string;
  end: string;
  room: string;
};

export function TimetableView({
  slots,
  batches,
  teachers,
  initialBatch,
  initialTeacher = "",
  today,
  nowMinutes,
}: {
  slots: TimetableSource[];
  batches: { id: string; code: string }[];
  teachers: { id: string; name: string }[];
  initialBatch: string;
  initialTeacher?: string;
  today: WeekDay | "fri";
  nowMinutes: number;
}) {
  const [view, setView] = useState<"week" | "day">("week");
  const [day, setDay] = useState<WeekDay>(today === "fri" ? "sat" : today);
  const [batchId, setBatchId] = useState(initialBatch);
  const [classLevel, setClassLevel] = useState("");
  const [teacherId, setTeacherId] = useState(initialTeacher);
  const [room, setRoom] = useState("");
  const [settings, updateSettings] = useRoutineSettings();
  const levels = [...new Set(slots.map((slot) => slot.classLevel))].sort((a, b) => a - b);
  const rooms = [...new Set(slots.map((slot) => slot.room).filter(Boolean))].sort();

  const filtered = useMemo(
    () =>
      slots.filter(
        (slot) =>
          (!batchId || slot.batchId === batchId) &&
          (!classLevel || String(slot.classLevel) === classLevel) &&
          (!teacherId || slot.teacherId === teacherId) &&
          (!room || slot.room === room)
      ),
    [slots, batchId, classLevel, teacherId, room]
  );

  const exportName = batchId
    ? `${batches.find((batch) => batch.id === batchId)?.code ?? "batch"}-routine`
    : teacherId
      ? `${teachers.find((teacher) => teacher.id === teacherId)?.name ?? "teacher"}-routine`
      : room
        ? `room-${room}-routine`
        : "sage-class-routine";
  const heading = batchId
    ? batches.find((batch) => batch.id === batchId)?.code
    : teacherId
      ? `${teachers.find((teacher) => teacher.id === teacherId)?.name ?? "Teacher"} — weekly classes`
      : room
        ? `Room ${room}`
        : "SAGE class routine";

  const blocks = filtered.map((slot) => ({
    key: `${slot.batchId}-${slot.id}`,
    day: slot.day,
    start: slot.start,
    end: slot.end,
    title: slot.subjectName,
    sub: [batchId ? "" : slot.batchCode, slot.room ? `Room ${slot.room}` : "", teacherId ? "" : slot.teacherName].filter(Boolean).join(" · "),
    tone: subjectTone(slot.subjectName),
    href: `/admin/academy/batches/${slot.batchId}/routine`,
  }));

  // Labelled details for the exported routine sheet.
  const distinct = (values: string[]) => [...new Set(values.filter(Boolean))].sort().join(", ");
  const sheetInfo = [
    ...(teacherId
      ? [
          { label: "Teacher", value: teachers.find((teacher) => teacher.id === teacherId)?.name ?? "" },
          { label: "Subjects", value: distinct(filtered.map((slot) => slot.subjectName)) },
          { label: "Batches", value: distinct(filtered.map((slot) => slot.batchCode)) },
        ]
      : []),
    ...(batchId
      ? [
          { label: "Batch", value: batches.find((batch) => batch.id === batchId)?.code ?? "" },
          { label: "Subjects", value: distinct(filtered.map((slot) => slot.subjectName)) },
          { label: "Teachers", value: distinct(filtered.map((slot) => slot.teacherName)) },
        ]
      : []),
    ...(classLevel ? [{ label: "Class", value: `Class ${classLevel}` }] : []),
    ...(room ? [{ label: "Room", value: room }] : []),
    ...(!teacherId && !batchId && !classLevel && !room ? [{ label: "Showing", value: "All batches" }] : []),
  ].filter((item, index, list) => list.findIndex((other) => other.label === item.label) === index);

  return (
    <>
      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="table-toolbar" style={{ borderBottom: 0 }}>
          <select className="toolbar-select" value={batchId} onChange={(event) => setBatchId(event.target.value)} aria-label="Batch">
            <option value="">All batches</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.code}
              </option>
            ))}
          </select>
          <select className="toolbar-select" value={classLevel} onChange={(event) => setClassLevel(event.target.value)} aria-label="Class">
            <option value="">All classes</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                Class {level}
              </option>
            ))}
          </select>
          <select className="toolbar-select" value={teacherId} onChange={(event) => setTeacherId(event.target.value)} aria-label="Teacher">
            <option value="">All teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
          <select className="toolbar-select" value={room} onChange={(event) => setRoom(event.target.value)} aria-label="Room">
            <option value="">All rooms</option>
            {rooms.map((value) => (
              <option key={value} value={value}>
                Room {value}
              </option>
            ))}
          </select>
          <span className="toolbar-spacer" />
          <div className="segmented" role="tablist" aria-label="View">
            <button type="button" className={view === "week" ? "active" : ""} onClick={() => setView("week")}>
              Week
            </button>
            <button type="button" className={view === "day" ? "active" : ""} onClick={() => setView("day")}>
              Day
            </button>
          </div>
          <span className="cell-sub" style={{ marginTop: 0 }}>
            {filtered.length} class{filtered.length === 1 ? "" : "es"} a week
          </span>
        </div>
      </section>
      {view === "day" ? (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{WEEK_DAY_LABELS[day]}{day === today ? " · Today" : ""}</h2>
              <p>Every class on this day, placed on the timeline.</p>
            </div>
            <div className="segmented" role="tablist" aria-label="Day">
              {WEEK_DAYS.map((value) => (
                <button key={value} type="button" className={day === value ? "active" : ""} onClick={() => setDay(value)}>
                  {WEEK_DAY_LABELS[value].slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <ScheduleBoard
            nowMinutes={day === today ? nowMinutes : -1}
            emptyText={`No classes on ${WEEK_DAY_LABELS[day]}.`}
            classes={filtered
              .filter((slot) => slot.day === day)
              .map((slot) => ({
                key: `${slot.batchId}-${slot.id}`,
                start: slot.start,
                end: slot.end,
                subject: slot.subjectName,
                meta: [slot.batchCode, slot.room ? `R${slot.room}` : ""].filter(Boolean).join(" · "),
                tone: subjectTone(slot.subjectName),
                href: `/admin/academy/batches/${slot.batchId}/routine`,
              }))}
          />
        </section>
      ) : (
        <section className="panel timetable-panel">
          <RoutineToolbar
            settings={settings}
            onChange={updateSettings}
            exportId="sage-class-routine"
            exportName={exportName}
            sheet={{ blocks, info: sheetInfo, heading: teacherId && !batchId ? "Teacher Routine" : "Class Routine" }}
          />
          <RoutineWeek
            id="sage-class-routine"
            title={heading}
            settings={settings}
            emptyText={
              teacherId && !batchId && !classLevel && !room
                ? `${teachers.find((teacher) => teacher.id === teacherId)?.name ?? "This teacher"} has no classes yet. Pick them as a subject's teacher in a batch (Batches → Edit batch), then add that batch's class times.`
                : "No classes match these filters."
            }
            blocks={blocks}
          />
        </section>
      )}
    </>
  );
}

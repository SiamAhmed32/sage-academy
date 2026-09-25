"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, X } from "lucide-react";

import { Avatar, SeatMeter, StatusChip } from "@/components/admin/sa/ui";
import {
  studentEnrollmentsAction,
  transferOptionsAction,
  transferSubjectAction,
} from "@/app/admin/academy/_actions/students";
import { StudentPicker, type PickedStudent } from "./StudentPicker";
import { ErrorNotice, useAction } from "./use-action";

type Enrollment = { enrollmentId: string; subject: string; batchCode: string; batchId: string };
type Option = { id: string; code: string; students: number; capacity: number; full: boolean; clashes: string[]; teacher: string; slots: number };

export type TransferEnrollment = Enrollment;
export type TransferOption = Option;

export function TransferTool({
  initialStudent,
  initialEnrollments,
  initialEnrollment,
  initialOptions,
}: {
  initialStudent: PickedStudent | null;
  initialEnrollments: Enrollment[];
  initialEnrollment: string;
  initialOptions: Option[] | null;
}) {
  const [student, setStudent] = useState<PickedStudent | null>(initialStudent);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [enrollmentId, setEnrollmentId] = useState(initialEnrollment);
  const [options, setOptions] = useState<Option[] | null>(initialOptions);
  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState("");
  const { pending, error, setError, run } = useAction();

  // Data is fetched from event handlers; a link with ?student= arrives preloaded.
  async function loadEnrollments(id: string) {
    const result = await studentEnrollmentsAction(id);
    setEnrollments(result.ok ? result.data ?? [] : []);
  }

  async function loadOptions(id: string) {
    const result = await transferOptionsAction(id);
    if (result.ok) setOptions(result.data ?? []);
    else setError(result.message);
  }

  function pickStudent(next: PickedStudent) {
    setStudent(next);
    setEnrollments([]);
    loadEnrollments(next.id);
  }

  function chooseEnrollment(id: string) {
    setDone("");
    setTarget("");
    setOptions(null);
    setEnrollmentId(id);
    loadOptions(id);
  }

  const current = enrollments.find((row) => row.enrollmentId === enrollmentId);
  const chosen = options?.find((option) => option.id === target);

  if (!student) {
    return (
      <section className="panel" style={{ maxWidth: 760 }}>
        <div className="panel-head">
          <div>
            <h2>1. Find the student</h2>
            <p>Move one subject to another batch of the same class, gender and version. Fees stay the same.</p>
          </div>
        </div>
        <div className="panel-body">
          <StudentPicker onPick={pickStudent} autoFocus />
        </div>
      </section>
    );
  }

  return (
    <div className="two-panels">
      <div className="stack">
        <section className="panel">
          <div className="panel-head">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar name={student.name} />
              <div>
                <h2>{student.name}</h2>
                <p>
                  {student.studentId} · {student.className} · Home batch {student.batchCode}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="row-action"
              onClick={() => {
                setStudent(null);
                setEnrollmentId("");
                setEnrollments([]);
                setDone("");
              }}
            >
              <X size={14} /> Change
            </button>
          </div>
          <div className="panel-body">
            <p className="eyebrow" style={{ marginBottom: 10 }}>
              2. Choose the subject to move
            </p>
            {enrollments.length === 0 ? <p className="cell-sub">This student has no active subjects.</p> : null}
            <div className="option-grid">
              {enrollments.map((row) => (
                <label key={row.enrollmentId} className={`check-card${enrollmentId === row.enrollmentId ? " selected" : ""}`}>
                  <input type="radio" name="subject" checked={enrollmentId === row.enrollmentId} onChange={() => chooseEnrollment(row.enrollmentId)} />
                  <span>
                    <strong style={{ display: "block", fontSize: 14 }}>{row.subject}</strong>
                    <code>{row.batchCode}</code>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {enrollmentId ? (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>3. Choose the new batch</h2>
                <p>Batches that teach {current?.subject ?? "this subject"} for the same class, gender and version.</p>
              </div>
            </div>
            <div className="panel-body">
              {options === null ? <p className="cell-sub">Loading batches...</p> : null}
              {options && options.length === 0 ? (
                <div className="notice warn">
                  <AlertTriangle size={16} />
                  <span>No other batch teaches this subject for this group.</span>
                </div>
              ) : null}
              <div style={{ display: "grid", gap: 10 }}>
                {options?.map((option) => {
                  const blocked = option.full || option.clashes.length > 0;
                  return (
                    <label key={option.id} className={`check-card${target === option.id ? " selected" : ""}${blocked ? " disabled" : ""}`} style={{ alignItems: "flex-start" }}>
                      <input type="radio" name="target" disabled={blocked} checked={target === option.id} onChange={() => setTarget(option.id)} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <code>{option.code}</code>
                          {option.full ? <StatusChip tone="danger">Full</StatusChip> : null}
                          {option.clashes.length > 0 ? <StatusChip tone="warning">Timetable clash</StatusChip> : null}
                          {!blocked ? <StatusChip tone="success">Available</StatusChip> : null}
                        </span>
                        <small style={{ display: "block", color: "var(--muted)", margin: "6px 0" }}>
                          {option.teacher || "Teacher not set"} · {option.slots} class{option.slots === 1 ? "" : "es"} a week
                        </small>
                        <SeatMeter used={option.students} capacity={option.capacity} />
                        {option.clashes.length > 0 ? (
                          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: "#8a4712" }}>
                            {option.clashes.map((clash) => (
                              <li key={clash}>{clash}</li>
                            ))}
                          </ul>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <aside className="panel" style={{ position: "sticky", top: 100 }}>
        <div className="panel-head">
          <div>
            <h2>Confirm transfer</h2>
            <p>The move is logged with your name.</p>
          </div>
        </div>
        <div className="panel-body">
          {done ? (
            <div className="notice success" style={{ marginBottom: 16 }}>
              <CheckCircle2 size={16} />
              <span>
                {done}{" "}
                <Link href={`/admin/academy/students/${student.id}?tab=routine`} className="text-button">
                  See routine
                </Link>
              </span>
            </div>
          ) : null}
          <ErrorNotice message={error} />
          <div className="summary-list" style={{ marginBottom: 16 }}>
            <div>
              <span>Subject</span>
              <span>{current?.subject ?? "—"}</span>
            </div>
            <div>
              <span>From</span>
              <span>{current ? <code>{current.batchCode}</code> : "—"}</span>
            </div>
            <div>
              <span>To</span>
              <span>{chosen ? <code>{chosen.code}</code> : "—"}</span>
            </div>
            <div>
              <span>Monthly fee</span>
              <span>Unchanged</span>
            </div>
          </div>
          <label className="field">
            Reason (optional)
            <input className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Time suits better" />
          </label>
          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%" }}
            disabled={pending || !chosen}
            onClick={() =>
              run(() => transferSubjectAction({ enrollmentId, toBatchId: target, note }), {
                onSuccess: () => {
                  setDone(`${current?.subject} moved to ${chosen?.code}.`);
                  setTarget("");
                  setNote("");
                  if (student) loadEnrollments(student.id);
                  loadOptions(enrollmentId);
                },
              })
            }
          >
            {pending ? "Moving..." : "Move subject"} <ArrowRight size={17} />
          </button>
        </div>
      </aside>
    </div>
  );
}

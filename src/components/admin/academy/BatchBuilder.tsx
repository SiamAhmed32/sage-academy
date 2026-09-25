"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Save } from "lucide-react";

import { SaSelect } from "@/components/admin/sa/SaSelect";
import { previewBatchCodeAction, saveBatchAction } from "@/app/admin/academy/_actions/setup";
import {
  BATCH_GENDERS,
  BATCH_GENDER_LABELS,
  VERSIONS,
  VERSION_LABELS,
  type BatchGender,
  type Version,
  type WeekDay,
} from "@/lib/academy/constants";
import { formatTaka, isTime, timeToMinutes } from "@/lib/academy/codes";
import { externalClashes, internalOverlaps, type ClashSlot } from "@/lib/academy/routine";
import type { ClassOption, SubjectOption, TeacherOption } from "@/lib/academy/queries";
import { ErrorNotice, useAction } from "./use-action";

type RoutineRow = { key: string; subjectId: string; days: WeekDay[]; start: string; end: string; room: string };

export type BatchBuilderExisting = {
  id: string;
  code: string;
  year: number;
  classId: string;
  gender: BatchGender;
  version: Version;
  capacity: number;
  note: string;
  students: number;
  subjects: { subjectId: string; teacherId: string }[];
  routine: { subjectId: string; day: WeekDay; start: string; end: string; room: string }[];
};

export type OtherSlot = ClashSlot & { batchId: string };

let rowSeed = 0;
const newKey = () => `row-${Date.now()}-${(rowSeed += 1)}`;

/** Existing slots → editable rows (same subject, time and room across days = one row). */
function groupRoutine(routine: BatchBuilderExisting["routine"]): RoutineRow[] {
  const rows = new Map<string, RoutineRow>();
  for (const slot of routine) {
    const key = `${slot.subjectId}|${slot.start}|${slot.end}|${slot.room}`;
    const row = rows.get(key) ?? { key: newKey(), subjectId: slot.subjectId, days: [], start: slot.start, end: slot.end, room: slot.room };
    row.days.push(slot.day);
    rows.set(key, row);
  }
  return [...rows.values()];
}

export function BatchBuilder({
  classes,
  subjects,
  teachers,
  years,
  otherSlots,
  existing,
  initialPreview = null,
  part,
  onSaved,
  readOnly = false,
  readOnlyActions,
}: {
  classes: ClassOption[];
  subjects: SubjectOption[];
  teachers: TeacherOption[];
  years: number[];
  otherSlots: OtherSlot[];
  existing?: BatchBuilderExisting;
  initialPreview?: { code: string; sequence: number } | null;
  /** Only "setup" (details + subjects in the side drawer); the routine is edited on the week grid. */
  part: "setup";
  /** Called after the drawer form is saved. */
  onSaved?: () => void;
  /** Setup form shown locked (view mode), with `readOnlyActions` in place of the save button. */
  readOnly?: boolean;
  readOnlyActions?: ReactNode;
}) {
  const router = useRouter();
  const editing = Boolean(existing);
  const year = existing?.year ?? years[0];
  const [classId, setClassId] = useState(existing?.classId ?? classes[0]?.id ?? "");
  const [gender, setGender] = useState<BatchGender>(existing?.gender ?? "boys");
  const [version, setVersion] = useState<Version>(existing?.version ?? "bangla");
  const [capacity, setCapacity] = useState(String(existing?.capacity ?? 30));
  const [note, setNote] = useState(existing?.note ?? "");
  const [chosen, setChosen] = useState<Record<string, string>>(() =>
    Object.fromEntries((existing?.subjects ?? []).map((item) => [item.subjectId, item.teacherId]))
  );
  const [rows, setRows] = useState<RoutineRow[]>(() => groupRoutine(existing?.routine ?? []));
  const [preview, setPreview] = useState<{ code: string; sequence: number } | null>(
    existing ? { code: existing.code, sequence: 0 } : initialPreview
  );
  const { pending, error, run } = useAction();

  const classSubjects = useMemo(() => subjects.filter((subject) => subject.classId === classId), [subjects, classId]);
  const selectedSubjects = classSubjects.filter((subject) => subject.id in chosen);
  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);
  const teacherById = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher])), [teachers]);
  const cls = classes.find((item) => item.id === classId);

  // Live batch code preview (the real number is reserved on save).
  useEffect(() => {
    if (editing || !classId) return;
    let cancelled = false;
    previewBatchCodeAction({ classId, gender, version }).then((result) => {
      if (!cancelled && result.ok && result.data) setPreview(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [editing, classId, gender, version]);

  function changeClass(value: string) {
    setClassId(value);
    setChosen({});
    setRows([]);
  }

  /** All teachers, those whose "teaches" label mentions the subject first. The admin always picks. */
  function teacherOptions(subjectName: string) {
    const key = subjectName.toLowerCase();
    const matches = (teacher: TeacherOption) => teacher.subject.toLowerCase().includes(key);
    const sorted = [...teachers].sort((x, y) => Number(matches(y)) - Number(matches(x)) || x.name.localeCompare(y.name));
    return [
      { value: "", label: "Teacher not set" },
      ...sorted.map((teacher) => ({ value: teacher.id, label: teacher.name + (teacher.subject ? ` — ${teacher.subject}` : "") })),
    ];
  }

  function selectAll(on: boolean) {
    if (!on) {
      setChosen({});
      setRows([]);
      return;
    }
    setChosen((current) => Object.fromEntries(classSubjects.map((subject) => [subject.id, current[subject.id] ?? ""])));
  }

  function toggleSubject(id: string) {
    const next = { ...chosen };
    if (id in next) {
      delete next[id];
      setRows((value) => value.filter((row) => row.subjectId !== id));
    } else {
      next[id] = "";
    }
    setChosen(next);
  }

  // Flatten rows into slots for preview + clash checks.
  const slots: ClashSlot[] = rows.flatMap((row) =>
    row.days
      .filter(() => row.subjectId && isTime(row.start) && isTime(row.end))
      .map((day) => ({
        subjectId: row.subjectId,
        day,
        start: row.start,
        end: row.end,
        room: row.room,
        subjectName: subjectById.get(row.subjectId)?.name ?? "Subject",
        batchCode: preview?.code ?? "This batch",
        teacherId: chosen[row.subjectId] || null,
        teacherName: teacherById.get(chosen[row.subjectId] ?? "")?.name ?? "",
      }))
  );

  const rowProblems = rows.flatMap((row) => {
    const name = subjectById.get(row.subjectId)?.name ?? "A class";
    if (!row.subjectId) return ["Choose a subject for every class time."];
    if (row.days.length === 0) return [`${name}: pick at least one day.`];
    if (!isTime(row.start) || !isTime(row.end)) return [`${name}: enter start and end times.`];
    if (timeToMinutes(row.end) <= timeToMinutes(row.start)) return [`${name}: the end time must be after the start time.`];
    return [];
  });
  const clashProblems = [
    ...internalOverlaps(slots),
    ...externalClashes(
      slots,
      otherSlots.filter((slot) => slot.batchId !== existing?.id)
    ),
  ];
  const problems = [...rowProblems, ...clashProblems];
  const monthlyTotal = selectedSubjects.reduce((sum, subject) => sum + (version === "english" ? subject.english : subject.bangla), 0);

  function save() {
    run(
      () =>
        saveBatchAction({
          id: existing?.id,
          year,
          classId,
          gender,
          version,
          capacity: Number(capacity),
          note,
          subjects: selectedSubjects.map((subject) => ({ subjectId: subject.id, teacherId: chosen[subject.id] ?? "" })),
          routine: slots.map((slot) => ({ subjectId: slot.subjectId, day: slot.day, start: slot.start, end: slot.end, room: slot.room })),
        }),
      {
        refresh: false,
        onSuccess: (data) => {
          if (!data?.id) return;
          if (part === "setup") {
            // Drawer: close and refresh the list — the routine is set from the row's Routine button.
            onSaved?.();
            router.refresh();
          }
        },
      }
    );
  }

  const notices = (
    <>
      <ErrorNotice message={error} />
      {problems.length > 0 ? (
        <div className="notice danger" style={{ margin: "12px 0" }}>
          <AlertTriangle size={16} />
          <div>
            <strong>Fix these before saving</strong>
            <ul>
              {problems.slice(0, 5).map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );

  const saveButton = (
    <button
      type="button"
      className="btn-primary"
      style={{ width: "100%" }}
      onClick={save}
      disabled={pending || problems.length > 0 || selectedSubjects.length === 0 || !classId}
    >
      <Save size={17} />
      {pending ? "Saving..." : editing ? "Save changes" : "Create batch"}
    </button>
  );

  return (
    <div className="stack" style={{ gap: 18, paddingBottom: 12 }}>
      <div
        style={{
          borderRadius: 14,
          background: "var(--brand-faint)",
          border: "1px solid #f0d9da",
          padding: "14px 16px",
          textAlign: "center",
        }}
      >
        <span className="cell-sub">{editing ? "Batch code — never changes" : "New batch code — given when you save"}</span>
        <strong style={{ display: "block", fontSize: 26, letterSpacing: "0.04em", color: "var(--brand)", fontVariantNumeric: "tabular-nums" }}>
          {preview?.code ?? "—"}
        </strong>
        <span className="cell-sub">
          {cls ? `${cls.name} · ${BATCH_GENDER_LABELS[gender]} · ${VERSION_LABELS[version]}` : "Choose a class"}
          {preview && !editing ? ` · Batch ${preview.sequence}` : ""}
        </span>
      </div>

      <div className="form-grid">
        <label className="field wide">
          Class
          <SaSelect
            value={classId}
            disabled={editing || readOnly}
            onChange={changeClass}
            options={classes.map((item) => ({ value: item.id, label: item.name }))}
          />
        </label>
        <div className="field">
          Boys or girls
          <div className="segmented">
            {BATCH_GENDERS.map((value) => (
              <button key={value} type="button" className={gender === value ? "active" : ""} disabled={editing || readOnly} onClick={() => setGender(value)}>
                {BATCH_GENDER_LABELS[value]}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          Version
          <div className="segmented">
            {VERSIONS.map((value) => (
              <button key={value} type="button" className={version === value ? "active" : ""} disabled={editing || readOnly} onClick={() => setVersion(value)}>
                {VERSION_LABELS[value]}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          Maximum students<span className="req">*</span>
          <input
            className="input"
            type="number"
            min={Math.max(1, existing?.students ?? 1)}
            value={capacity}
            disabled={readOnly}
            onChange={(event) => setCapacity(event.target.value)}
          />
          <small>
            Enrollment is blocked when the batch is full.
            {existing ? ` ${existing.students} enrolled now.` : ""}
          </small>
        </label>
        <label className="field">
          Note (optional)
          <input className="input" value={note} disabled={readOnly} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Evening shift" maxLength={300} />
        </label>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <strong style={{ fontSize: 15 }}>Subjects taught in this batch</strong>
          {classSubjects.length > 1 && !readOnly ? (
            <button type="button" className="text-button" onClick={() => selectAll(selectedSubjects.length < classSubjects.length)}>
              {selectedSubjects.length < classSubjects.length ? "Select all" : "Clear"}
            </button>
          ) : null}
        </div>
        <small style={{ color: "var(--muted)" }}>
          Fees come from the Subjects page ({version === "english" ? "English" : "Bangla"} version fee).
        </small>
        <div style={{ marginTop: 10 }}>
          {classSubjects.length === 0 ? (
            <div className="notice warn">
              <AlertTriangle size={16} />
              <span>{cls?.name ?? "This class"} has no subjects yet. Add them on the Subjects page first.</span>
            </div>
          ) : (
            <div className="subject-pick-grid">
              {(readOnly ? selectedSubjects : classSubjects).map((subject) => {
                const selected = subject.id in chosen;
                return (
                  <div key={subject.id} className={`check-card subject-pick${selected ? " selected" : ""}`}>
                    <label>
                      <input type="checkbox" checked={selected} disabled={readOnly} onChange={() => toggleSubject(subject.id)} />
                      <span>
                        <strong>{subject.name}</strong>
                        <small>{formatTaka(version === "english" ? subject.english : subject.bangla)} / month</small>
                      </span>
                    </label>
                    {selected ? (
                      <SaSelect
                        size="sm"
                        value={chosen[subject.id]}
                        disabled={readOnly}
                        onChange={(value) => setChosen((current) => ({ ...current, [subject.id]: value }))}
                        ariaLabel={`Teacher for ${subject.name}`}
                        placeholder="Teacher not set"
                        options={teacherOptions(subject.name)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <dl className="summary-list" style={{ margin: 0 }}>
        <div>
          <dt>Subjects</dt>
          <dd>{selectedSubjects.length}</dd>
        </div>
        <div>
          <dt>All subjects, per month</dt>
          <dd>{formatTaka(monthlyTotal)}</dd>
        </div>
      </dl>
      {readOnly ? (
        readOnlyActions
      ) : (
        <>
          {notices}
          {saveButton}
        </>
      )}
    </div>
  );
}

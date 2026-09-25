"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Save, Trash2, Undo2 } from "lucide-react";

import { saveBatchAction } from "@/app/admin/academy/_actions/setup";
import { Modal } from "@/components/admin/sa/Modal";
import { SaSelect } from "@/components/admin/sa/SaSelect";
import { RoutineToolbar, RoutineWeek, minutesToTime, useRoutineSettings, type RoutineBlock } from "@/components/admin/sa/RoutineWeek";
import { WEEK_DAYS, WEEK_DAY_SHORT, subjectTone, type BatchGender, type Version, type WeekDay } from "@/lib/academy/constants";
import { isTime, timeToMinutes } from "@/lib/academy/codes";
import { externalClashes, internalOverlaps, type ClashSlot } from "@/lib/academy/routine";
import { ErrorNotice, useAction } from "./use-action";
import type { OtherSlot } from "./BatchBuilder";

type Slot = { key: string; subjectId: string; day: WeekDay; start: string; end: string; room: string };
type Draft = { key?: string; subjectId: string; days: WeekDay[]; start: string; end: string; room: string };

export type RoutineBatch = {
  id: string;
  code: string;
  label: string;
  year: number;
  classId: string;
  gender: BatchGender;
  version: Version;
  capacity: number;
  note: string;
  subjects: { subjectId: string; name: string; teacherId: string; teacherName: string }[];
  routine: { subjectId: string; day: WeekDay; start: string; end: string; room: string }[];
};

let seed = 0;
const newKey = () => `slot-${Date.now()}-${(seed += 1)}`;

export function RoutineEditor({ batch, otherSlots }: { batch: RoutineBatch; otherSlots: OtherSlot[] }) {
  const router = useRouter();
  const [settings, updateSettings] = useRoutineSettings();
  const initial = useMemo(() => batch.routine.map((slot) => ({ ...slot, key: newKey() })), [batch.routine]);
  const [slots, setSlots] = useState<Slot[]>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(strip(initial)));
  const [draft, setDraft] = useState<Draft | null>(null);
  const { pending, error, run } = useAction();

  const subjectById = useMemo(() => new Map(batch.subjects.map((subject) => [subject.subjectId, subject])), [batch.subjects]);
  const others = useMemo(() => otherSlots.filter((slot) => slot.batchId !== batch.id), [otherSlots, batch.id]);
  const dirty = JSON.stringify(strip(slots)) !== saved;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const toClash = (slot: { subjectId: string; day: WeekDay; start: string; end: string; room: string }): ClashSlot => {
    const subject = subjectById.get(slot.subjectId);
    return {
      ...slot,
      subjectName: subject?.name ?? "Subject",
      batchCode: batch.code,
      teacherId: subject?.teacherId || null,
      teacherName: subject?.teacherName ?? "",
    };
  };

  function clashesFor(slot: Slot, all: Slot[]) {
    const self = toClash(slot);
    const inside = all.filter((other) => other.key !== slot.key).flatMap((other) => internalOverlaps([self, toClash(other)]));
    return [...inside, ...externalClashes([self], others)];
  }

  const blocks: RoutineBlock[] = slots.map((slot) => {
    const subject = subjectById.get(slot.subjectId);
    return {
      key: slot.key,
      day: slot.day,
      start: slot.start,
      end: slot.end,
      title: subject?.name ?? "Subject",
      sub: [slot.room ? `Room ${slot.room}` : "", subject?.teacherName ?? ""].filter(Boolean).join(" · "),
      tone: subjectTone(subject?.name ?? "Subject"),
      clashes: clashesFor(slot, slots),
    };
  });
  const clashCount = blocks.filter((block) => block.clashes?.length).length;
  const missing = batch.subjects.filter((subject) => !slots.some((slot) => slot.subjectId === subject.subjectId));

  function openNew(day: WeekDay, start: string) {
    // Default to a subject that has no class yet, and the last room used.
    const subjectId = missing[0]?.subjectId ?? batch.subjects[0]?.subjectId ?? "";
    const end = minutesToTime(timeToMinutes(start) + settings.step);
    setDraft({ subjectId, days: [day], start, end, room: slots[slots.length - 1]?.room ?? "" });
  }

  function openEdit(key: string) {
    const slot = slots.find((item) => item.key === key);
    if (slot) setDraft({ key, subjectId: slot.subjectId, days: [slot.day], start: slot.start, end: slot.end, room: slot.room });
  }

  // The draft as slots (one per ticked day), for live checks in the dialog.
  const draftSlots: Slot[] = draft
    ? draft.days.map((day, index) => ({ key: index === 0 && draft.key ? draft.key : `draft-${day}`, subjectId: draft.subjectId, day, start: draft.start, end: draft.end, room: draft.room.trim() }))
    : [];
  const draftProblem = !draft
    ? ""
    : !draft.subjectId
      ? "Choose a subject."
      : draft.days.length === 0
        ? "Pick at least one day."
        : !isTime(draft.start) || !isTime(draft.end)
          ? "Enter start and end times."
          : timeToMinutes(draft.end) <= timeToMinutes(draft.start)
            ? "The end time must be after the start time."
            : "";
  const rest = slots.filter((slot) => slot.key !== draft?.key);
  const draftClashes = draftProblem ? [] : [...new Set(draftSlots.flatMap((slot) => clashesFor(slot, [...rest, ...draftSlots])))];

  function applyDraft() {
    if (!draft || draftProblem) return;
    setSlots([...rest, ...draftSlots.map((slot) => ({ ...slot, key: slot.key.startsWith("draft-") ? newKey() : slot.key }))]);
    setDraft(null);
  }

  function removeDraft() {
    if (!draft?.key) return;
    setSlots(rest);
    setDraft(null);
  }

  function save() {
    run(
      () =>
        saveBatchAction({
          id: batch.id,
          year: batch.year,
          classId: batch.classId,
          gender: batch.gender,
          version: batch.version,
          capacity: batch.capacity,
          note: batch.note,
          subjects: batch.subjects.map((subject) => ({ subjectId: subject.subjectId, teacherId: subject.teacherId })),
          routine: strip(slots),
        }),
      {
        onSuccess: () => {
          setSaved(JSON.stringify(strip(slots)));
          router.refresh();
        },
      }
    );
  }

  return (
    <>
      <section className="panel timetable-panel">
        <RoutineToolbar
          settings={settings}
          onChange={updateSettings}
          exportId="batch-routine-grid"
          exportName={`${batch.code}-routine`}
          sheet={{
            blocks,
            info: [
              { label: "Batch", value: batch.code },
              { label: "Group", value: batch.label },
              { label: "Subjects", value: batch.subjects.map((subject) => subject.name).join(", ") },
              { label: "Teachers", value: [...new Set(batch.subjects.map((subject) => subject.teacherName).filter(Boolean))].join(", ") },
            ],
          }}
        >
          <button type="button" className="btn-secondary" onClick={() => openNew("sat", minutesToTime(settings.from))} disabled={batch.subjects.length === 0}>
            <Plus size={17} /> Add class
          </button>
        </RoutineToolbar>

        {dirty || clashCount || missing.length ? (
          <div className={`routine-status${clashCount ? " danger" : ""}`}>
            <span>
              {clashCount ? (
                <>
                  <AlertTriangle size={15} /> {clashCount} class{clashCount === 1 ? "" : "es"} clash — hover the red blocks to see why.
                </>
              ) : missing.length ? (
                `No class time yet for ${missing.map((subject) => subject.name).join(", ")}. Click an empty cell to add one.`
              ) : (
                "You have unsaved changes."
              )}
            </span>
            {dirty ? (
              <span className="routine-toolbar-group">
                <button type="button" className="btn-secondary" onClick={() => setSlots(JSON.parse(saved).map((slot: Omit<Slot, "key">) => ({ ...slot, key: newKey() })))} disabled={pending}>
                  <Undo2 size={17} /> Discard
                </button>
                <button type="button" className="btn-primary" onClick={save} disabled={pending || clashCount > 0}>
                  <Save size={17} /> {pending ? "Saving..." : "Save routine"}
                </button>
              </span>
            ) : null}
          </div>
        ) : null}
        <div style={{ padding: "0 16px" }}>
          <ErrorNotice message={error} />
        </div>

        <RoutineWeek
          id="batch-routine-grid"
          title={
            <>
              {batch.code} <span className="cell-sub" style={{ display: "inline", fontWeight: 500 }}>· {batch.label}</span>
            </>
          }
          blocks={blocks}
          settings={settings}
          onEmptyClick={batch.subjects.length ? openNew : undefined}
          onBlockClick={openEdit}
          emptyText={batch.subjects.length ? "Click any empty cell to add a class." : "This batch has no subjects yet — add them with Edit batch."}
        />
      </section>

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        eyebrow={batch.code}
        title={draft?.key ? "Change class" : "Add class"}
        actions={
          <>
            {draft?.key ? (
              <button type="button" className="btn-secondary" onClick={removeDraft} style={{ marginRight: "auto", color: "#b42318" }}>
                <Trash2 size={16} /> Remove
              </button>
            ) : null}
            <button type="button" className="btn-secondary" onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={applyDraft} disabled={Boolean(draftProblem)}>
              {draft?.key ? "Update" : "Add to routine"}
            </button>
          </>
        }
      >
        {draft ? (
          <div className="form-grid">
            <label className="field wide">
              Subject
              <SaSelect
                value={draft.subjectId}
                onChange={(value) => setDraft({ ...draft, subjectId: value })}
                options={batch.subjects.map((subject) => ({
                  value: subject.subjectId,
                  label: subject.name + (subject.teacherName ? ` — ${subject.teacherName}` : ""),
                }))}
              />
            </label>
            <div className="field wide">
              {draft.key ? "Day" : "Days (tick more to repeat)"}
              <div className="segmented">
                {WEEK_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={draft.days.includes(day) ? "active" : ""}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        days: draft.key ? [day] : draft.days.includes(day) ? draft.days.filter((item) => item !== day) : [...draft.days, day],
                      })
                    }
                  >
                    {WEEK_DAY_SHORT[day]}
                  </button>
                ))}
              </div>
            </div>
            <label className="field">
              Start
              <input className="input" type="time" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} />
            </label>
            <label className="field">
              End
              <input className="input" type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} />
            </label>
            <label className="field wide">
              Room (optional)
              <input className="input" value={draft.room} placeholder="e.g. 201" maxLength={20} onChange={(event) => setDraft({ ...draft, room: event.target.value })} />
            </label>
            {draftProblem || draftClashes.length ? (
              <div className={`notice ${draftProblem ? "warn" : "danger"} wide`}>
                <AlertTriangle size={16} />
                <div>
                  {draftProblem ? (
                    draftProblem
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {draftClashes.slice(0, 5).map((problem) => (
                        <li key={problem}>{problem}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function strip(slots: Slot[]) {
  return slots
    .map(({ subjectId, day, start, end, room }) => ({ subjectId, day, start, end, room }))
    .sort((a, b) => WEEK_DAYS.indexOf(a.day) - WEEK_DAYS.indexOf(b.day) || a.start.localeCompare(b.start) || a.subjectId.localeCompare(b.subjectId));
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Plus, Trash2 } from "lucide-react";

import type { ClassRow } from "@/components/admin/academic-structure/types";

type TeacherOption = { _id: string; name: string };
type SubjectOption = { _id: string; name: string; code?: string; baseMonthlyFee: number };

type RoutineDraft = { dayOfWeek: string; startTime: string; endTime: string; roomNumber: string };

type SubjectRowState = {
  subjectId: string;
  included: boolean;
  maxSeats: number;
  monthlyFee: number;
  teacherId: string;
  routines: RoutineDraft[];
};

const DAYS = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

function emptyRoutine(): RoutineDraft {
  return { dayOfWeek: "SATURDAY", startTime: "16:00", endTime: "17:00", roomNumber: "" };
}

export function CreateBatchForm({ classes, teachers }: { classes: ClassRow[]; teachers: TeacherOption[] }) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?._id ?? "");
  const [medium, setMedium] = useState("BANGLA");
  const [gender, setGender] = useState("MALE");
  const [batchNumber, setBatchNumber] = useState(1);
  const [name, setName] = useState("");
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [rows, setRows] = useState<Record<string, SubjectRowState>>({});
  const [loadingSubjects, setLoadingSubjects] = useState(Boolean(classes[0]?._id));
  const [submitting, setSubmitting] = useState(false);

  // Auto-populate every active subject for the selected class whenever it changes.
  const loadSubjects = useCallback(async (signal?: AbortSignal) => {
    if (!classId) return;
    try {
      const res = await fetch(`/api/subjects?classId=${classId}`, { signal });
      const json: { data?: Array<{ _id: string; name: string; code?: string; baseMonthlyFee: number }> } =
        await res.json();
      if (signal?.aborted) return;
      const list: SubjectOption[] = (json.data ?? []).map((s) => ({
        _id: s._id,
        name: s.name,
        code: s.code,
        baseMonthlyFee: s.baseMonthlyFee,
      }));
      setSubjects(list);
      setRows(
        Object.fromEntries(
          list.map((s) => [
            s._id,
            {
              subjectId: s._id,
              included: true,
              maxSeats: 30,
              monthlyFee: s.baseMonthlyFee,
              teacherId: "",
              routines: [emptyRoutine()],
            } as SubjectRowState,
          ])
        )
      );
    } finally {
      if (!signal?.aborted) setLoadingSubjects(false);
    }
  }, [classId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadSubjects(controller.signal);
    return () => controller.abort();
  }, [loadSubjects]);

  function updateRow(subjectId: string, patch: Partial<SubjectRowState>) {
    setRows((prev) => ({ ...prev, [subjectId]: { ...prev[subjectId], ...patch } }));
  }

  function updateRoutine(subjectId: string, index: number, patch: Partial<RoutineDraft>) {
    setRows((prev) => {
      const row = prev[subjectId];
      const routines = row.routines.map((r, i) => (i === index ? { ...r, ...patch } : r));
      return { ...prev, [subjectId]: { ...row, routines } };
    });
  }

  function addRoutine(subjectId: string) {
    setRows((prev) => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], routines: [...prev[subjectId].routines, emptyRoutine()] },
    }));
  }

  function removeRoutine(subjectId: string, index: number) {
    setRows((prev) => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], routines: prev[subjectId].routines.filter((_, i) => i !== index) },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Enter a batch name.");
      return;
    }

    const selected = Object.values(rows).filter((r) => r.included);
    if (selected.length === 0) {
      toast.error("Select at least one subject for this batch.");
      return;
    }

    const payload = {
      name: name.trim(),
      classId,
      medium,
      gender,
      batchNumber: Number(batchNumber),
      subjects: selected.map((r) => ({
        subjectId: r.subjectId,
        maxSeats: Number(r.maxSeats) || 30,
        monthlyFee: Number(r.monthlyFee) || 0,
        teacherId: r.teacherId || "",
        routines: r.routines.filter((rt) => rt.startTime && rt.endTime),
      })),
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/batches/composite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create batch");
      }
      toast.success("Batch created successfully.");
      router.push("/admin/academic-structure/batch-groups");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-sage-border bg-white p-4">
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Class</label>
          <select
            value={classId}
            onChange={(e) => {
              setLoadingSubjects(true);
              setClassId(e.target.value);
            }}
            className="h-10 w-44 rounded-lg border border-sage-border px-3 text-sm"
          >
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Medium</label>
          <select value={medium} onChange={(e) => setMedium(e.target.value)} className="h-10 w-32 rounded-lg border border-sage-border px-3 text-sm">
            <option value="BANGLA">Bangla</option>
            <option value="ENGLISH">English</option>
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="h-10 w-32 rounded-lg border border-sage-border px-3 text-sm">
            <option value="MALE">Boys</option>
            <option value="FEMALE">Girls</option>
            <option value="COMBINED">Combined</option>
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Batch name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Batch 1" className="h-10 w-48 rounded-lg border border-sage-border px-3 text-sm" />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Batch #</label>
          <input type="number" min={1} value={batchNumber} onChange={(e) => setBatchNumber(Number(e.target.value))} className="h-10 w-20 rounded-lg border border-sage-border px-3 text-sm" />
        </div>
      </div>

      <div className="rounded-xl border border-sage-border bg-white p-4">
        <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-sage-secondary">
          Subjects for this class {loadingSubjects && "· loading…"}
        </h3>

        {subjects.length === 0 ? (
          <p className="text-sm text-sage-gray-500">
            {loadingSubjects ? "Loading subjects…" : "This class has no subjects yet. Add subjects first."}
          </p>
        ) : (
          <div className="space-y-4">
            {subjects.map((s) => {
              const row = rows[s._id];
              if (!row) return null;
              return (
                <div key={s._id} className="rounded-lg border border-sage-border p-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-sage-secondary">
                      <input
                        type="checkbox"
                        checked={row.included}
                        onChange={(e) => updateRow(s._id, { included: e.target.checked })}
                        className="accent-sage-primary"
                      />
                      {s.name}
                    </label>
                    <div className="grid gap-1">
                      <label className="text-[10px] font-bold text-sage-gray-500">Max seats</label>
                      <input
                        type="number"
                        min={1}
                        value={row.maxSeats}
                        onChange={(e) => updateRow(s._id, { maxSeats: Number(e.target.value) })}
                        disabled={!row.included}
                        className="h-9 w-24 rounded-lg border border-sage-border px-2 text-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[10px] font-bold text-sage-gray-500">Monthly fee</label>
                      <input
                        type="number"
                        min={0}
                        value={row.monthlyFee}
                        onChange={(e) => updateRow(s._id, { monthlyFee: Number(e.target.value) })}
                        disabled={!row.included}
                        className="h-9 w-28 rounded-lg border border-sage-border px-2 text-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[10px] font-bold text-sage-gray-500">Teacher</label>
                      <select
                        value={row.teacherId}
                        onChange={(e) => updateRow(s._id, { teacherId: e.target.value })}
                        disabled={!row.included}
                        className="h-9 w-40 rounded-lg border border-sage-border px-2 text-sm disabled:opacity-50"
                      >
                        <option value="">— none —</option>
                        {teachers.map((t) => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {row.included && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-sage-gray-500">Weekly routine</p>
                      {row.routines.map((r, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2">
                          <select
                            value={r.dayOfWeek}
                            onChange={(e) => updateRoutine(s._id, i, { dayOfWeek: e.target.value })}
                            className="h-9 w-32 rounded-lg border border-sage-border px-2 text-xs"
                          >
                            {DAYS.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          <input
                            type="time"
                            value={r.startTime}
                            onChange={(e) => updateRoutine(s._id, i, { startTime: e.target.value })}
                            className="h-9 w-28 rounded-lg border border-sage-border px-2 text-xs"
                          />
                          <input
                            type="time"
                            value={r.endTime}
                            onChange={(e) => updateRoutine(s._id, i, { endTime: e.target.value })}
                            className="h-9 w-28 rounded-lg border border-sage-border px-2 text-xs"
                          />
                          <input
                            placeholder="Room"
                            value={r.roomNumber}
                            onChange={(e) => updateRoutine(s._id, i, { roomNumber: e.target.value })}
                            className="h-9 w-24 rounded-lg border border-sage-border px-2 text-xs"
                          />
                          <button type="button" onClick={() => removeRoutine(s._id, i)} className="text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addRoutine(s._id)}
                        className="flex items-center gap-1 text-xs font-bold text-sage-primary"
                      >
                        <Plus size={14} /> Add time slot
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting || subjects.length === 0}
        className="h-12 rounded-lg bg-sage-primary px-8 text-sm font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save Batch"}
      </button>
    </form>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

import { createSubjectAction, deleteSubjectAction } from "@/app/admin/actions/academic-structure";
import { formatAdminCurrency } from "@/lib/admin-format";
import { cn } from "@/lib/utils";
import type { ClassRow, SubjectRow } from "@/components/admin/academic-structure/types";

/**
 * Groups subjects by their parent class and renders one collapsible card per
 * class instead of a single flat table — stays readable once dozens of
 * subjects exist across grades. Subject creation/deletion still go through
 * the existing `createSubjectAction` / `deleteSubjectAction` server actions
 * (no new API or schema), so adding a subject re-renders this same grouped
 * view via Next's normal server-action refresh — no browser navigation.
 */
export function SubjectsManager({ classes, subjects }: { classes: ClassRow[]; subjects: SubjectRow[] }) {
  const subjectsByClass = useMemo(() => {
    const map = new Map<string, SubjectRow[]>();
    for (const subject of subjects) {
      const classId = subject.classId?._id;
      if (!classId) continue;
      map.set(classId, [...(map.get(classId) ?? []), subject]);
    }
    return map;
  }, [subjects]);

  // Expanded by default only for classes that already have subjects — an
  // empty class stays collapsed until the admin opens or adds to it.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(classes.filter((c) => (subjectsByClass.get(c._id)?.length ?? 0) > 0).map((c) => c._id))
  );
  const [formClassId, setFormClassId] = useState(classes[0]?._id ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  function toggle(classId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  }

  function quickAddTo(classId: string) {
    setFormClassId(classId);
    setExpanded((prev) => new Set(prev).add(classId));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    nameInputRef.current?.focus();
  }

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        action={createSubjectAction}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-sage-border bg-white p-4"
      >
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Class</label>
          <select
            name="classId"
            required
            value={formClassId}
            onChange={(e) => setFormClassId(e.target.value)}
            className="h-10 w-48 rounded-lg border border-sage-border px-3 text-sm"
          >
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Subject name</label>
          <input ref={nameInputRef} name="name" required placeholder="Physics" className="h-10 w-44 rounded-lg border border-sage-border px-3 text-sm" />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Code (optional)</label>
          <input name="code" placeholder="PHY" className="h-10 w-28 rounded-lg border border-sage-border px-3 text-sm" />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Base monthly fee</label>
          <input name="baseMonthlyFee" type="number" min={0} required className="h-10 w-32 rounded-lg border border-sage-border px-3 text-sm" />
        </div>
        <button type="submit" className="h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white">
          Add subject
        </button>
      </form>

      <div className="space-y-3">
        {classes.map((c) => {
          const classSubjects = subjectsByClass.get(c._id) ?? [];
          const isOpen = expanded.has(c._id);
          const panelId = `subjects-panel-${c._id}`;

          return (
            <div key={c._id} className="overflow-hidden rounded-xl border border-sage-border bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sage-border bg-sage-red-50/30 px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggle(c._id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <ChevronDown
                    size={16}
                    strokeWidth={2.5}
                    className={cn("shrink-0 text-sage-secondary transition-transform duration-200", isOpen && "rotate-180")}
                  />
                  <span className="truncate text-sm font-black text-sage-secondary">{c.name}</span>
                  <span className="shrink-0 rounded-full bg-sage-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-sage-primary">
                    {classSubjects.length} subject{classSubjects.length === 1 ? "" : "s"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => quickAddTo(c._id)}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-sage-border bg-white px-2.5 py-1.5 text-xs font-bold text-sage-primary hover:bg-sage-red-50"
                >
                  <Plus size={12} /> Add subject to {c.name}
                </button>
              </div>

              <div
                id={panelId}
                hidden={!isOpen}
                className={isOpen ? "grid grid-rows-[1fr]" : "grid grid-rows-[0fr]"}
              >
                <div className="min-h-0 overflow-hidden">
                  {classSubjects.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-sage-gray-400">
                      No subjects added for this class yet.
                    </p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs font-black uppercase tracking-wide text-sage-gray-500">
                        <tr>
                          <th className="px-4 py-2">Subject</th>
                          <th className="px-4 py-2">Code</th>
                          <th className="px-4 py-2">Base fee</th>
                          <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classSubjects.map((s) => (
                          <tr key={s._id} className="border-t border-sage-border">
                            <td className="px-4 py-3 font-bold text-sage-secondary">{s.name}</td>
                            <td className="px-4 py-3">{s.code || "—"}</td>
                            <td className="px-4 py-3">{formatAdminCurrency(s.baseMonthlyFee)}</td>
                            <td className="px-4 py-3 text-right">
                              <form action={deleteSubjectAction}>
                                <input type="hidden" name="id" value={s._id} />
                                <button type="submit" className="text-xs font-bold text-red-600 hover:underline">
                                  Delete
                                </button>
                              </form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

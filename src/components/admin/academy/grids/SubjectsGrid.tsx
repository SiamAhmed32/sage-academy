"use client";

import { SaSelect } from "@/components/admin/sa/SaSelect";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import Link from "next/link";
import { Archive, BookOpen, CalendarClock, Info, ListChecks, Plus } from "lucide-react";

import { cancelUpcomingFeeAction, deleteSubjectAction, saveSubjectAction, setSubjectArchivedAction } from "@/app/admin/academy/_actions/setup";
import { ArchiveBanner, ArchiveButton, ArchivedRowActions, useArchiveView } from "@/components/admin/academy/archive";
import { ErrorNotice, useAction } from "@/components/admin/academy/use-action";
import { SaDataGrid, type GridContext, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, TitleCell, moneyCol, numberCol, setCol, textCol } from "@/components/admin/grid/cells";
import { Modal } from "@/components/admin/sa/Modal";
import { PageHeading } from "@/components/admin/sa/ui";
import { addMonths, currentMonthKey, formatTaka, monthLabel } from "@/lib/academy/codes";
import type { ClassOption } from "@/lib/academy/queries";

type Row = {
  id: string;
  classId: string;
  className: string;
  classLevel: number;
  name: string;
  code: string;
  isArchived: boolean;
  status: "active" | "archived";
  bangla: number;
  english: number;
  upcoming: { from: string; bangla: number; english: number } | null;
  history: { from: string; bangla: number; english: number; by: string }[];
  batches: number;
  students: number;
};

type Form = { id?: string; classId: string; name: string; code: string; bangla: string; english: string };
type SubjectsContext = GridContext & { edit: (row: Row) => void };

function SubjectActions({ data, context }: ICellRendererParams<Row, unknown, SubjectsContext>) {
  const { pending, run } = useAction();
  if (!data) return null;
  if (data.isArchived) {
    return (
      <ActionIcons>
        <ArchivedRowActions
          name={data.name}
          restore={() => setSubjectArchivedAction(data.id, false)}
          remove={() => deleteSubjectAction(data.id)}
          onDone={() => context.refresh()}
        />
      </ActionIcons>
    );
  }
  return (
    <ActionIcons onEdit={() => context.edit(data)}>
      <IconAction
        icon={Archive}
        label="Archive subject"
        tone="danger"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Archive ${data.name}? It must not be in an active batch or taken by any student.`)) return;
          run(() => setSubjectArchivedAction(data.id, true), { onSuccess: () => context.refresh() });
        }}
      />
    </ActionIcons>
  );
}

export function SubjectsGrid({
  tiles,
  classes,
  initialClass,
  counts,
}: {
  tiles: GridTile[];
  classes: ClassOption[];
  initialClass: string;
  /** Active subjects per class id, for the tab badges. */
  counts: Record<string, number>;
}) {
  const grid = useRef<SaDataGridHandle>(null);
  const inArchive = useArchiveView();
  const archivedCount = Number(tiles.find((tile) => tile.key === "archived")?.value ?? 0);
  const [classFilter, setClassFilter] = useState(initialClass);
  const [form, setForm] = useState<Form | null>(null);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const { pending, error, setError, run } = useAction();

  const params = useMemo(() => (classFilter ? { classId: classFilter } : undefined), [classFilter]);
  const shownClass = useRef(initialClass);
  useEffect(() => {
    if (shownClass.current === classFilter) return;
    shownClass.current = classFilter;
    grid.current?.refresh();
  }, [classFilter]);

  function openNew() {
    setError("");
    setEditingRow(null);
    setForm({ classId: classFilter || classes[0]?.id || "", name: "", code: "", bangla: "", english: "" });
  }

  function openEdit(row: Row) {
    setError("");
    setEditingRow(row);
    setForm({
      id: row.id,
      classId: row.classId,
      name: row.name,
      code: row.code,
      bangla: String(row.upcoming?.bangla ?? row.bangla),
      english: String(row.upcoming?.english ?? row.english),
    });
  }

  function done() {
    setForm(null);
    grid.current?.refresh();
  }

  function save() {
    if (!form) return;
    run(() => saveSubjectAction({ ...form, bangla: Number(form.bangla || 0), english: Number(form.english || 0) }), { onSuccess: done });
  }

  const nextMonth = monthLabel(addMonths(currentMonthKey(), 1));
  const feeChanged = editingRow && form && (Number(form.bangla) !== editingRow.bangla || Number(form.english) !== editingRow.english);

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "name",
        headerName: "Subject",
        minWidth: 220,
        flex: 1.2,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? <TitleCell icon={BookOpen} title={data.name} sub={data.code ? data.code : "No code"} /> : null,
      },
      { field: "code", headerName: "Code", width: 110, hide: true, ...textCol() },
      {
        field: "classLevel",
        headerName: "Class",
        width: 120,
        ...setCol(classes.map((item) => ({ value: item.level, label: item.name }))),
        valueFormatter: ({ data }) => data?.className ?? "",
        context: { exportValue: (row: Row) => row.className },
      },
      { field: "bangla", headerName: "Bangla fee", width: 130, ...moneyCol() },
      { field: "english", headerName: "English fee", width: 130, ...moneyCol() },
      {
        colId: "upcoming",
        headerName: "Scheduled change",
        minWidth: 200,
        flex: 1,
        sortable: false,
        cellRenderer: ({ data }: { data?: Row }) =>
          data?.upcoming ? (
            <Pill tone="info">
              {formatTaka(data.upcoming.bangla)} / {formatTaka(data.upcoming.english)} from {monthLabel(data.upcoming.from, true)}
            </Pill>
          ) : (
            <Muted>—</Muted>
          ),
        context: {
          exportValue: (row: Row) => (row.upcoming ? `${row.upcoming.bangla}/${row.upcoming.english} from ${row.upcoming.from}` : ""),
        },
      },
      { field: "batches", headerName: "Batches", width: 110, ...numberCol() },
      { field: "students", headerName: "Students", width: 115, ...numberCol() },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        hide: true,
        ...setCol([
          { value: "active", label: "Active" },
          { value: "archived", label: "Archived" },
        ]),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? data.isArchived ? <Pill tone="neutral">Archived</Pill> : <Pill tone="success">Active</Pill> : null,
      },
      { colId: "actions", headerName: "", width: 110, cellRenderer: SubjectActions },
    ],
    [classes]
  );

  return (
    <>
      <PageHeading
        eyebrow="Academics · Step 2"
        title="Subjects"
        description="Each subject belongs to a class and has two monthly fees: Bangla version and English version. Fees can only be changed here."
        actions={
          <>
            <ArchiveButton count={archivedCount} />
            <Link href="/admin/academy/batches/new" className="btn-secondary">
              <ListChecks size={17} /> Next: create batch
            </Link>
            <button type="button" className="btn-primary" onClick={openNew} disabled={classes.length === 0}>
              <Plus size={17} /> Add subject
            </button>
          </>
        }
      />
      {inArchive ? <ArchiveBanner what="subjects" note="A subject can be deleted only when no batch or student record uses it." /> : null}
      <SaDataGrid<Row>
        ref={grid}
        source="academy-subjects"
        gridId="academy-subjects"
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        key={inArchive ? "archived" : "list"}
        tiles={inArchive ? undefined : tiles}
        initialPreset={inArchive ? "archived" : ""}
        params={params}
        context={{ edit: openEdit }}
        searchPlaceholder="Search subject, code or class…"
        emptyTitle={classes.length === 0 ? "Add a class first" : "No subjects found"}
        emptyDescription={
          classes.length === 0
            ? "Subjects belong to a class. Create your classes, then come back here."
            : "Add each subject with two monthly fees — Bangla version and English version."
        }
        exportName="sage-subjects"
        beforeToolbar={
          classes.length ? (
            <div className="sa-class-tabs" role="tablist" aria-label="Class">
              {[{ id: "", name: "All classes" }, ...classes].map((item) => {
                const count = item.id ? counts[item.id] ?? 0 : Object.values(counts).reduce((sum, n) => sum + n, 0);
                const active = classFilter === item.id;
                return (
                  <button
                    key={item.id || "all"}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`sa-class-tab${active ? " active" : ""}`}
                    onClick={() => setClassFilter(item.id)}
                  >
                    {item.name}
                    <b>{count}</b>
                  </button>
                );
              })}
            </div>
          ) : null
        }
      />

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        eyebrow="Subjects"
        title={editingRow ? `Edit ${editingRow.name}` : "Add a subject"}
        description="Each subject has two monthly fees. English version batches use the English fee; Bangla version batches use the Bangla fee."
        wide
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setForm(null)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={save} disabled={pending}>
              {pending ? "Saving..." : "Save subject"}
            </button>
          </>
        }
      >
        {form ? (
          <>
            <ErrorNotice message={error} />
            <div className="form-grid">
              <label className="field">
                Class<span className="req">*</span>
                <SaSelect
                  value={form.classId}
                  disabled={Boolean(editingRow)}
                  onChange={(value) => setForm({ ...form, classId: value })}
                  options={classes.map((item) => ({ value: item.id, label: item.name }))}
                />
              </label>
              <label className="field">
                Subject name<span className="req">*</span>
                <input
                  className="input"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. Mathematics"
                  maxLength={60}
                />
              </label>
              <label className="field">
                Short code
                <input
                  className="input"
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                  placeholder="e.g. MATH"
                  maxLength={12}
                />
              </label>
              <span />
              <label className="field">
                Bangla version fee (monthly)<span className="req">*</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.bangla}
                  onChange={(event) => setForm({ ...form, bangla: event.target.value })}
                  placeholder="0"
                />
              </label>
              <label className="field">
                English version fee (monthly)<span className="req">*</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.english}
                  onChange={(event) => setForm({ ...form, english: event.target.value })}
                  placeholder="0"
                />
              </label>
            </div>

            {editingRow && feeChanged && editingRow.students > 0 ? (
              <div className="notice warn" style={{ marginBottom: 16 }}>
                <CalendarClock size={16} />
                <span>
                  {editingRow.students === 1 ? "1 student takes" : `${editingRow.students} students take`} this subject. The new fees start from{" "}
                  <strong>{nextMonth}</strong>. This month&apos;s bills and anything already billed stay the same.
                </span>
              </div>
            ) : null}

            {editingRow?.upcoming ? (
              <div className="notice" style={{ marginBottom: 16, justifyContent: "space-between" }}>
                <Info size={16} />
                <span style={{ flex: 1 }}>
                  A change is scheduled from {monthLabel(editingRow.upcoming.from)}: Bangla {formatTaka(editingRow.upcoming.bangla)}, English{" "}
                  {formatTaka(editingRow.upcoming.english)}.
                </span>
                <button
                  type="button"
                  className="text-button"
                  disabled={pending}
                  onClick={() => run(() => cancelUpcomingFeeAction(editingRow.id), { onSuccess: done })}
                >
                  Cancel change
                </button>
              </div>
            ) : null}

            {editingRow && editingRow.history.length > 1 ? (
              <div style={{ marginBottom: 16 }}>
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  Fee history
                </p>
                <div className="summary-list">
                  {editingRow.history.map((entry) => (
                    <div key={entry.from}>
                      <span>{entry.from === "2000-01" ? "From the start" : `From ${monthLabel(entry.from)}`}</span>
                      <span>
                        {formatTaka(entry.bangla)} / {formatTaka(entry.english)}
                        {entry.by ? <small style={{ fontWeight: 400, color: "var(--muted)" }}> · {entry.by}</small> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </Modal>
    </>
  );
}

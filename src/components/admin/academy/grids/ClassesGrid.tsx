"use client";

import { SaSelect } from "@/components/admin/sa/SaSelect";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Archive, BookOpen, Layers, Plus, RotateCcw } from "lucide-react";

import { saveClassAction, setClassArchivedAction } from "@/app/admin/academy/_actions/setup";
import { ErrorNotice, useAction } from "@/components/admin/academy/use-action";
import { SaDataGrid, type GridContext, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Pill, TitleCell, numberCol, setCol, textCol } from "@/components/admin/grid/cells";
import { Modal } from "@/components/admin/sa/Modal";
import { PageHeading } from "@/components/admin/sa/ui";

type Row = {
  id: string;
  name: string;
  level: number;
  isArchived: boolean;
  status: "active" | "archived";
  subjects: number;
  batches: number;
  students: number;
};

type ClassesContext = GridContext & { edit: (row: Row) => void };

function ClassActions({ data, context }: ICellRendererParams<Row, unknown, ClassesContext>) {
  const { pending, run } = useAction();
  if (!data) return null;
  return (
    <ActionIcons onEdit={() => context.edit(data)}>
      <IconAction
        icon={data.isArchived ? RotateCcw : Archive}
        label={data.isArchived ? "Restore class" : "Archive class"}
        tone={data.isArchived ? "success" : "danger"}
        disabled={pending}
        onClick={() => run(() => setClassArchivedAction(data.id, !data.isArchived), { onSuccess: () => context.refresh() })}
      />
    </ActionIcons>
  );
}

export function ClassesGrid({ tiles, usedLevels }: { tiles: GridTile[]; usedLevels: number[] }) {
  const grid = useRef<SaDataGridHandle>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [level, setLevel] = useState("");
  const [name, setName] = useState("");
  const { pending, error, setError, run } = useAction();

  function open(row: Row | "new") {
    setError("");
    setEditing(row);
    if (row === "new") {
      const used = new Set(usedLevels);
      const next = Array.from({ length: 12 }, (_, index) => index + 1).find((value) => !used.has(value)) ?? 1;
      setLevel(String(next));
      setName(`Class ${next}`);
    } else {
      setLevel(String(row.level));
      setName(row.name);
    }
  }

  function save() {
    run(() => saveClassAction({ id: editing === "new" ? undefined : editing?.id, level: Number(level), name }), {
      onSuccess: () => {
        setEditing(null);
        grid.current?.refresh();
      },
    });
  }

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "name",
        headerName: "Class",
        minWidth: 220,
        flex: 1.2,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? <TitleCell icon={Layers} title={data.name} sub={`Code C${String(data.level).padStart(2, "0")}`} /> : null,
      },
      { field: "level", headerName: "Level", width: 110, ...numberCol() },
      {
        field: "subjects",
        headerName: "Subjects",
        width: 130,
        ...numberCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <Link href={`/admin/academy/subjects?class=${data.id}`} className="text-button">
              {data.subjects}
            </Link>
          ) : null,
      },
      { field: "batches", headerName: "Active batches", width: 150, ...numberCol() },
      { field: "students", headerName: "Active students", width: 155, ...numberCol() },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        ...setCol([
          { value: "active", label: "Active" },
          { value: "archived", label: "Archived" },
        ]),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? data.isArchived ? <Pill tone="neutral">Archived</Pill> : <Pill tone="success">Active</Pill> : null,
      },
      { colId: "actions", headerName: "", width: 100, cellRenderer: ClassActions },
    ],
    []
  );

  return (
    <>
      <PageHeading
        eyebrow="Academics · Step 1"
        title="Classes"
        description="The classes SAGE teaches. Every subject belongs to one class, and every batch is built from one class."
        actions={
          <>
            <Link href="/admin/academy/subjects" className="btn-secondary">
              <BookOpen size={17} /> Next: subjects
            </Link>
            <button type="button" className="btn-primary" onClick={() => open("new")}>
              <Plus size={17} /> Add class
            </button>
          </>
        }
      />
      <SaDataGrid<Row>
        ref={grid}
        source="academy-classes"
        gridId="academy-classes"
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        context={{ edit: open }}
        searchPlaceholder="Search classes…"
        emptyTitle="No classes yet"
        emptyDescription="Add the classes SAGE teaches, for example Class 6 to Class 10."
        exportName="sage-classes"
      />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        eyebrow="Classes"
        title={editing === "new" ? "Add a class" : "Edit class"}
        description="The class level is part of every batch code, e.g. Class 6 → 06."
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={save} disabled={pending}>
              {pending ? "Saving..." : "Save class"}
            </button>
          </>
        }
      >
        <ErrorNotice message={error} />
        <div className="form-grid">
          <label className="field">
            Class level<span className="req">*</span>
            <SaSelect
              value={level}
              onChange={(value) => {
                if (name === `Class ${level}` || !name) setName(`Class ${value}`);
                setLevel(value);
              }}
              options={Array.from({ length: 12 }, (_, index) => index + 1).map((value) => ({ value: String(value), label: `Class ${value}` }))}
            />
          </label>
          <label className="field">
            Display name
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} />
          </label>
        </div>
      </Modal>
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Archive, CalendarClock, CalendarDays, ListChecks, Plus, RotateCcw } from "lucide-react";

import { deleteBatchAction, getBatchForEditAction, setBatchStatusAction } from "@/app/admin/academy/_actions/setup";
import { ArchiveBanner, ArchiveButton, ArchivedRowActions, useArchiveView } from "@/components/admin/academy/archive";
import { BatchDrawer, type BatchFormData } from "@/components/admin/academy/BatchDrawer";
import type { BatchBuilderExisting } from "@/components/admin/academy/BatchBuilder";
import { useAction } from "@/components/admin/academy/use-action";
import { SaDataGrid, type GridContext, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Pill, TitleCell, numberCol, setCol, textCol } from "@/components/admin/grid/cells";
import { toast } from "react-toastify";

import { PageHeading } from "@/components/admin/sa/ui";
import { BATCH_GENDER_LABELS, VERSION_SHORT, type BatchGender, type Version } from "@/lib/academy/constants";

type Row = {
  id: string;
  code: string;
  year: number;
  classLevel: number;
  gender: BatchGender;
  version: Version;
  subjectCount: number;
  subjectNames: string;
  students: number;
  capacity: number;
  seatsLeft: number;
  routineCount: number;
  status: "active" | "archived";
};

type BatchesContext = GridContext & { open: (row: Row, mode: "view" | "edit") => void };

function BatchActions({ data, context }: ICellRendererParams<Row, unknown, BatchesContext>) {
  const { pending, run } = useAction();
  if (!data) return null;
  if (data.status === "archived") {
    return (
      <ActionIcons onView={() => context.open(data, "view")}>
        <ArchivedRowActions
          name={`batch ${data.code}`}
          restore={() => setBatchStatusAction(data.id, "active")}
          remove={() => deleteBatchAction(data.id)}
          onDone={() => context.refresh()}
        />
      </ActionIcons>
    );
  }
  const archive = data.status === "active";
  // The server refuses to archive a batch that still has students; say so up front.
  const blocked = archive && data.students > 0;
  return (
    <ActionIcons onView={() => context.open(data, "view")} onEdit={() => context.open(data, "edit")}>
      <IconAction icon={CalendarClock} label={data.routineCount ? "Edit routine" : "Set routine"} href={`/admin/academy/batches/${data.id}/routine`} />
      <IconAction
        icon={archive ? Archive : RotateCcw}
        label={blocked ? "Transfer or drop its students before archiving" : archive ? "Archive batch" : "Restore batch"}
        tone={archive ? "danger" : "success"}
        disabled={pending || blocked}
        onClick={() => {
          if (archive && !window.confirm(`Archive ${data.code}? It will be hidden from admission. Its code is never reused.`)) return;
          run(() => setBatchStatusAction(data.id, archive ? "archived" : "active"), { onSuccess: () => context.refresh() });
        }}
      />
    </ActionIcons>
  );
}

export function BatchesGrid({ tiles, form, openCreate = false }: { tiles: GridTile[]; form: BatchFormData; openCreate?: boolean }) {
  const classes = form.classes;
  const grid = useRef<SaDataGridHandle>(null);
  const inArchive = useArchiveView();
  const archivedCount = Number(tiles.find((tile) => tile.key === "archived")?.value ?? 0);
  const [drawer, setDrawer] = useState<{ existing?: BatchBuilderExisting; className?: string; classLevel?: number; view?: boolean } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // /batches?create=1 (links from other pages): open after hydration, then drop the flag so a reload doesn't reopen it.
  useEffect(() => {
    if (!openCreate) return;
    setDrawer({});
    const url = new URL(window.location.href);
    url.searchParams.delete("create");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [openCreate]);

  async function openBatch(row: Row, mode: "view" | "edit") {
    setLoadingId(row.id);
    const result = await getBatchForEditAction(row.id);
    setLoadingId(null);
    if (!result.ok || !result.data) {
      toast.error(result.message || "Could not open this batch.");
      return;
    }
    const { className, classLevel, ...existing } = result.data;
    setDrawer({ existing, className, classLevel, view: mode === "view" });
  }

  const drawerData: BatchFormData = drawer?.existing
    ? {
        ...form,
        years: [drawer.existing.year],
        classes: form.classes.some((item) => item.id === drawer.existing!.classId)
          ? form.classes
          : [...form.classes, { id: drawer.existing.classId, name: drawer.className ?? "Class", level: drawer.classLevel ?? 0 }],
      }
    : form;

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "code",
        headerName: "Batch",
        minWidth: 230,
        flex: 1.1,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <TitleCell
              icon={ListChecks}
              title={<code>{data.code}</code>}
              sub={`Class ${data.classLevel} · ${BATCH_GENDER_LABELS[data.gender]} · ${VERSION_SHORT[data.version]}`}
            />
          ) : null,
      },
      {
        field: "classLevel",
        headerName: "Class",
        width: 110,
        ...setCol(classes.map((item) => ({ value: item.level, label: item.name }))),
        valueFormatter: ({ value }) => (value ? `Class ${value}` : ""),
      },
      {
        field: "gender",
        headerName: "Gender",
        width: 110,
        ...setCol([
          { value: "boys", label: "Boys" },
          { value: "girls", label: "Girls" },
        ]),
        valueFormatter: ({ value }) => (value ? BATCH_GENDER_LABELS[value as BatchGender] : ""),
      },
      {
        field: "version",
        headerName: "Version",
        width: 115,
        ...setCol([
          { value: "bangla", label: "Bangla" },
          { value: "english", label: "English" },
        ]),
        valueFormatter: ({ value }) => (value ? VERSION_SHORT[value as Version] : ""),
      },
      {
        field: "subjectNames",
        headerName: "Subjects",
        width: 130,
        ...textCol(),
        tooltipField: "subjectNames",
        valueFormatter: ({ data }) => (data ? `${data.subjectCount} subject${data.subjectCount === 1 ? "" : "s"}` : ""),
        context: { exportValue: (row: Row) => row.subjectNames },
      },
      {
        field: "students",
        headerName: "Seats",
        width: 120,
        ...numberCol(),
        valueFormatter: ({ data }) => (data ? `${data.students}/${data.capacity}` : ""),
        context: { exportValue: (row: Row) => `${row.students}/${row.capacity}` },
      },
      { field: "capacity", headerName: "Capacity", width: 110, hide: true, ...numberCol() },
      { field: "seatsLeft", headerName: "Seats left", width: 115, hide: true, ...numberCol() },
      {
        field: "routineCount",
        headerName: "Weekly classes",
        width: 140,
        ...numberCol(),
        valueFormatter: ({ value }) => (value ? String(value) : "Not set"),
      },
      { field: "year", headerName: "Created", width: 95, hide: true, ...numberCol() },
      {
        field: "status",
        headerName: "Status",
        width: 125,
        sortable: false,
        filter: false,
        cellRenderer: ({ data }: { data?: Row }) =>
          !data ? null : data.status === "archived" ? (
            <Pill tone="neutral">Archived</Pill>
          ) : data.seatsLeft <= 0 ? (
            <Pill tone="danger">Full</Pill>
          ) : data.routineCount === 0 ? (
            <Pill tone="warning">No routine</Pill>
          ) : (
            <Pill tone="success">Open</Pill>
          ),
      },
      { colId: "actions", headerName: "", width: 160, cellRenderer: BatchActions },
    ],
    [classes]
  );

  return (
    <>
      <PageHeading
        eyebrow="Academics · Step 3"
        title="Batches"
        description="A batch is one class, one gender and one version — for example Class 6 Boys Bangla, Batch 1. It holds that class's subjects and a weekly routine. Code format CCGVNN — e.g. 06BB01 = Class 06, Boys, Bangla, Batch 01. Batches carry over from year to year."
        actions={
          <>
            <ArchiveButton count={archivedCount} />
            <Link href="/admin/academy/timetable" className="btn-secondary">
              <CalendarDays size={17} /> Show routine
            </Link>
            <button type="button" className="btn-primary" onClick={() => setDrawer({})} disabled={classes.length === 0}>
              <Plus size={17} /> Create batch
            </button>
          </>
        }
      />
      {inArchive ? <ArchiveBanner what="batches" note="A batch can be deleted only when no student record uses it. Its code is never reused." /> : null}
      <SaDataGrid<Row>
        ref={grid}
        source="academy-batches"
        gridId="academy-batches"
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        key={inArchive ? "archived" : "list"}
        tiles={inArchive ? undefined : tiles}
        initialPreset={inArchive ? "archived" : ""}
        context={{ open: (row: Row, mode: "view" | "edit") => (loadingId ? undefined : void openBatch(row, mode)) }}
        onRowClick={(row) => (loadingId ? undefined : void openBatch(row, "view"))}
        searchPlaceholder="Search batch code or subject…"
        emptyTitle="No batches found"
        emptyDescription="Clear the filters, or create a batch for a class, gender and version."
        exportName="sage-batches"
      />
      <BatchDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        onSaved={() => grid.current?.refresh()}
        onEdit={() => setDrawer((current) => (current ? { ...current, view: false } : current))}
        data={drawerData}
        existing={drawer?.existing}
        view={drawer?.view}
        className={drawer?.className}
      />
    </>
  );
}

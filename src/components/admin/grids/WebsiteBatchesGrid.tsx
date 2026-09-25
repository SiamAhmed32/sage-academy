"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColDef } from "ag-grid-community";
import { Archive, BookOpen, CalendarDays, Plus, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";

import { restoreAcademicBatchAction } from "@/app/admin/actions";
import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, TitleCell, dateCol, numberCol, setCol, textCol } from "@/components/admin/grid/cells";
import { BatchInfoModal } from "@/components/admin/batches/BatchInfoModal";
import { BatchRoutineModal } from "@/components/admin/batches/BatchRoutineModal";
import type { AdminBatch, TeacherOption } from "@/components/admin/batches/types";
import { adminGenderLabels, adminVersionLabels, getAdminClassLabel } from "@/constants/admin-display";
import { ConfirmDialog, readApiResult, requestGridRefresh, useGridRefreshListener, yesNoOptions, type ConfirmRequest } from "./shared";

const SOURCE = "website-batches";

// Stored status values are public (Bangla) website copy; the admin sees English labels.
const STATUS_OPTIONS = [
  { value: "ভর্তি চলছে", label: "Admission open" }, // admin-language-allow: persisted enum value
  { value: "শীঘ্রই শুরু", label: "Starting soon" }, // admin-language-allow: persisted enum value
  { value: "ভর্তি বন্ধ", label: "Admission closed" }, // admin-language-allow: persisted enum value
];
const STATUS_LABELS = new Map(STATUS_OPTIONS.map((option) => [option.value, option.label]));
const STATUS_TONES = new Map<string, "success" | "info" | "neutral">([
  [STATUS_OPTIONS[0].value, "success"],
  [STATUS_OPTIONS[1].value, "info"],
  [STATUS_OPTIONS[2].value, "neutral"],
]);

export type WebsiteBatchRow = {
  id: string;
  title: string;
  batchCode: string;
  classLevel: number;
  genderGroup: "male" | "female" | "combined";
  version: "bangla" | "english";
  subjects: NonNullable<AdminBatch["subjects"]>;
  subjectCount: number;
  subjectNames: string;
  routineNote: string;
  examSchedule: string;
  totalSeats: number;
  availableSeats: number;
  status: string;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
};

type Row = WebsiteBatchRow;

function toBatch(row: Row): AdminBatch & { _id: string } {
  return {
    _id: row.id,
    title: row.title,
    batchCode: row.batchCode,
    classLevel: row.classLevel,
    genderGroup: row.genderGroup,
    version: row.version,
    subjects: row.subjects,
    routineNote: row.routineNote,
    examSchedule: row.examSchedule,
    totalSeats: row.totalSeats,
    availableSeats: row.availableSeats,
    status: row.status,
    isActive: row.isActive,
    isArchived: row.isArchived,
  };
}

export function WebsiteBatchesGrid({
  tiles,
  teachers,
  openRoutine,
}: {
  tiles: GridTile[];
  teachers: TeacherOption[];
  /** A batch just created: its schedule opens straight away (from ?openRoutine=<id>). */
  openRoutine?: Row | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gridRef = useRef<SaDataGridHandle>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [routine, setRoutine] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [seenRoutineId, setSeenRoutineId] = useState<string | null>(null);
  useGridRefreshListener(SOURCE, gridRef);

  // Open the new batch's schedule once per id (state adjusted during render, not in an effect).
  if (openRoutine && openRoutine.id !== seenRoutineId) {
    setSeenRoutineId(openRoutine.id);
    setRoutine(openRoutine);
  }

  // Drop ?openRoutine from the address so a reload does not open it again.
  useEffect(() => {
    if (!searchParams?.get("openRoutine")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("openRoutine");
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  const reload = useCallback(() => {
    gridRef.current?.refresh(false);
    router.refresh();
  }, [router]);

  const archive = useCallback(
    async (row: Row) => {
      try {
        await readApiResult(await fetch(`/api/batches/${row.id}`, { method: "DELETE" }), "The batch could not be archived.");
        toast.success("Batch archived.");
        reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The batch could not be archived.");
      }
    },
    [reload]
  );

  const restore = useCallback(
    async (row: Row) => {
      try {
        const formData = new FormData();
        formData.append("id", row.id);
        await restoreAcademicBatchAction(formData);
        toast.success("Batch restored.");
        reload();
      } catch {
        toast.error("The batch could not be restored.");
      }
    },
    [reload]
  );

  const removeForever = useCallback(
    async (row: Row) => {
      try {
        await readApiResult(await fetch(`/api/batches/${row.id}?permanent=true`, { method: "DELETE" }), "The batch could not be deleted.");
        toast.success("Batch permanently deleted.");
        reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The batch could not be deleted.");
      }
    },
    [reload]
  );

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "title",
        headerName: "Batch",
        minWidth: 250,
        flex: 1.4,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) => (data ? <TitleCell icon={BookOpen} title={data.title} sub={data.batchCode} /> : null),
      },
      { field: "batchCode", headerName: "Code", width: 140, hide: true, ...textCol(), cellRenderer: ({ value }: { value?: string }) => <code>{value}</code> },
      {
        field: "classLevel",
        headerName: "Class",
        width: 110,
        ...setCol(Array.from({ length: 8 }, (_, index) => ({ value: index + 5, label: getAdminClassLabel(index + 5) }))),
        valueFormatter: ({ value }) => (value ? getAdminClassLabel(value as number) : "—"),
      },
      {
        field: "genderGroup",
        headerName: "Group",
        width: 120,
        ...setCol(["male", "female", "combined"].map((value) => ({ value, label: adminGenderLabels[value] }))),
        valueFormatter: ({ value }) => adminGenderLabels[String(value ?? "male")] ?? String(value ?? ""),
      },
      {
        field: "version",
        headerName: "Version",
        width: 150,
        ...setCol(["bangla", "english"].map((value) => ({ value, label: adminVersionLabels[value] }))),
        valueFormatter: ({ value }) => adminVersionLabels[String(value ?? "bangla")] ?? String(value ?? ""),
      },
      {
        field: "subjectCount",
        headerName: "Subjects",
        width: 110,
        ...numberCol(),
        tooltipValueGetter: ({ data }) => data?.subjectNames || "",
      },
      { field: "subjectNames", headerName: "Subject names", minWidth: 180, flex: 1, hide: true, ...textCol() },
      { field: "totalSeats", headerName: "Seats", width: 100, ...numberCol() },
      {
        field: "availableSeats",
        headerName: "Available",
        width: 115,
        ...numberCol(),
        cellRenderer: ({ value }: { value?: number }) =>
          value && value > 0 ? <strong style={{ color: "var(--brand)" }}>{value}</strong> : <Muted>0</Muted>,
      },
      {
        field: "routineNote",
        headerName: "Schedule note",
        minWidth: 180,
        flex: 1,
        ...textCol(),
        tooltipField: "routineNote",
        cellRenderer: ({ value }: { value?: string }) => (value ? value : <Muted>—</Muted>),
      },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        ...setCol(STATUS_OPTIONS),
        cellRenderer: ({ data }: { data?: Row }) =>
          !data ? null : data.isArchived ? (
            <Pill tone="neutral">Archived</Pill>
          ) : (
            <Pill tone={STATUS_TONES.get(data.status) ?? "neutral"}>{STATUS_LABELS.get(data.status) ?? data.status}</Pill>
          ),
        context: { exportValue: (row: Row) => (row.isArchived ? "Archived" : STATUS_LABELS.get(row.status) ?? row.status) },
      },
      {
        field: "isActive",
        headerName: "Active",
        width: 110,
        hide: true,
        ...setCol(yesNoOptions("Active", "Inactive")),
        valueFormatter: ({ value }) => (value ? "Active" : "Inactive"),
      },
      { field: "createdAt", headerName: "Created", width: 130, hide: true, ...dateCol() },
      {
        colId: "actions",
        headerName: "",
        width: 150,
        cellRenderer: ({ data }: { data?: Row }) =>
          !data ? null : (
            <ActionIcons
              onEdit={() => setEditing(data)}
              onDelete={
                data.isArchived
                  ? () =>
                      setConfirm({
                        title: "Permanently delete this batch?",
                        description: `${data.title} will be permanently deleted. This action cannot be undone.`,
                        confirmLabel: "Delete permanently",
                        danger: true,
                        run: () => removeForever(data),
                      })
                  : undefined
              }
            >
              <IconAction icon={CalendarDays} label="Subjects and schedule" onClick={() => setRoutine(data)} />
              {data.isArchived ? (
                <IconAction icon={RotateCcw} label="Restore batch" tone="success" onClick={() => restore(data)} />
              ) : (
                <IconAction
                  icon={Archive}
                  label="Archive batch"
                  onClick={() =>
                    setConfirm({
                      title: "Archive this batch?",
                      description: `${data.title} will be hidden from the website but retained in the database.`,
                      confirmLabel: "Archive batch",
                      run: () => archive(data),
                    })
                  }
                />
              )}
            </ActionIcons>
          ),
      },
    ],
    [archive, restore, removeForever]
  );

  return (
    <>
      <SaDataGrid<Row>
        ref={gridRef}
        source={SOURCE}
        gridId={SOURCE}
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        searchPlaceholder="Search title, code, subject or schedule…"
        emptyTitle="No batches found"
        emptyDescription="Clear the search or filters, or create a new batch."
        exportName="sage-website-batches"
      />

      {editing ? (
        <BatchInfoModal
          key={editing.id}
          batch={toBatch(editing)}
          open
          onClose={() => setEditing(null)}
          onSaved={() => gridRef.current?.refresh(false)}
        />
      ) : null}

      {routine ? (
        <BatchRoutineModal
          key={routine.id}
          batch={toBatch(routine)}
          teachers={teachers}
          open
          onClose={() => setRoutine(null)}
          onSaved={() => gridRef.current?.refresh(false)}
        />
      ) : null}

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

export function WebsiteBatchCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={17} /> New batch
      </button>
      {open ? <BatchInfoModal open onClose={() => setOpen(false)} onSaved={() => requestGridRefresh(SOURCE)} /> : null}
    </>
  );
}

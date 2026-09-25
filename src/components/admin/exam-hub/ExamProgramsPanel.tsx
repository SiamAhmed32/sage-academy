"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { BookOpenCheck, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import type { AdminExamProgram } from "@/components/admin/exam-hub/ExamHubManager";
import { ExamProgramForm } from "@/components/admin/exam-hub/ExamProgramForm";
import { ExamProgramViewModal } from "@/components/admin/exam-hub/ExamProgramViewModal";
import { useExamHubTiles } from "@/components/admin/exam-hub/use-exam-hub-tiles";
import { SaDataGrid, type GridContext, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, Muted, Pill, dateCol, moneyCol, numberCol, setCol, textCol, type PillTone } from "@/components/admin/grid/cells";
import { ButtonTitle, ThumbTitle, yesNoOptions } from "@/components/admin/grids/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminClassLevelOptions } from "@/constants/admin-display";
import { cn } from "@/lib/utils";

const SOURCE = "exam-programs";

type ProgramVariant = "online" | "offline";

type Row = AdminExamProgram & { id: string; createdAt: string };

type ProgramsContext = GridContext & {
  view: (row: Row) => void;
  edit: (row: Row) => void;
  remove: (row: Row) => void;
};

const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "hidden", label: "Hidden" },
  { value: "archived", label: "Archived" },
];

const STATUS_TONES: Record<string, PillTone> = {
  published: "success",
  draft: "neutral",
  hidden: "warning",
  archived: "neutral",
};

const OFFLINE_TYPE_LABELS: Record<string, string> = { weekly: "Weekly", monthly: "Monthly" };

function ProgramActions({ data, context }: ICellRendererParams<Row, unknown, ProgramsContext>) {
  if (!data) return null;
  return <ActionIcons onView={() => context.view(data)} onEdit={() => context.edit(data)} onDelete={() => context.remove(data)} />;
}

type Props = {
  tiles: GridTile[];
  onProgramUpsert: (program: AdminExamProgram) => void;
  onProgramDelete: (programId: string) => void;
};

export function ExamProgramsPanel({ tiles: initialTiles, onProgramUpsert, onProgramDelete }: Props) {
  const router = useRouter();
  const grid = useRef<SaDataGridHandle>(null);
  const { tiles, reload: reloadTiles } = useExamHubTiles("programs", "", initialTiles);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [createMode, setCreateMode] = useState<ProgramVariant>("online");
  const [editing, setEditing] = useState<AdminExamProgram | null>(null);
  const [savingProgram, setSavingProgram] = useState(false);

  const [viewTarget, setViewTarget] = useState<AdminExamProgram | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminExamProgram | null>(null);
  const [deleting, setDeleting] = useState(false);

  function reload() {
    grid.current?.refresh();
    void reloadTiles();
    router.refresh();
  }

  function openCreate(mode: ProgramVariant) {
    setEditing(null);
    setCreateMode(mode);
    setSheetOpen(true);
  }

  function openEdit(program: AdminExamProgram) {
    setEditing(program);
    setCreateMode(program.deliveryMode);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/exam-hub/programs/${deleteTarget._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Could not delete the exam program");
        return;
      }
      onProgramDelete(deleteTarget._id);
      toast.success("Exam program deleted successfully");
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  }

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "title",
        headerName: "Program",
        minWidth: 260,
        flex: 1.5,
        ...textCol(),
        cellRenderer: ({ data, context }: ICellRendererParams<Row, unknown, ProgramsContext>) =>
          data ? (
            <ButtonTitle onClick={() => context.view(data)}>
              <ThumbTitle
                image={data.image}
                icon={data.deliveryMode === "online" ? BookOpenCheck : MapPin}
                title={data.title}
                sub={`/${data.slug}`}
              />
            </ButtonTitle>
          ) : null,
      },
      { field: "slug", headerName: "Slug", width: 180, hide: true, ...textCol() },
      {
        field: "deliveryMode",
        headerName: "Mode",
        width: 120,
        ...setCol([
          { value: "online", label: "Online" },
          { value: "offline", label: "Offline" },
        ]),
        cellRenderer: ({ value }: { value?: string }) =>
          value === "offline" ? <Pill tone="warning">Offline</Pill> : <Pill tone="info">Online</Pill>,
      },
      {
        field: "offlineType",
        headerName: "Offline type",
        width: 130,
        ...setCol(Object.entries(OFFLINE_TYPE_LABELS).map(([value, label]) => ({ value, label }))),
        valueFormatter: ({ value }) => (value ? (OFFLINE_TYPE_LABELS[value as string] ?? String(value)) : "—"),
      },
      {
        field: "accessType",
        headerName: "Access",
        width: 150,
        ...setCol([
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
        ]),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            data.deliveryMode === "online" ? (
              <span style={{ display: "inline-flex", gap: 4 }}>
                <Pill tone="neutral">{data.accessType === "private" ? "Private" : "Public"}</Pill>
                {data.isPaid ? <Pill tone="danger">Paid</Pill> : null}
              </span>
            ) : (
              <Muted>—</Muted>
            )
          ) : null,
      },
      { field: "isPaid", headerName: "Paid", width: 110, hide: true, ...setCol(yesNoOptions("Paid", "Free")), valueFormatter: ({ value }) => (value ? "Paid" : "Free") },
      { field: "feeAmount", headerName: "Fee", width: 120, hide: true, ...moneyCol() },
      {
        field: "status",
        headerName: "Status",
        width: 125,
        ...setCol(STATUS_OPTIONS),
        cellRenderer: ({ value }: { value?: string }) =>
          value ? <Pill tone={STATUS_TONES[value] ?? "neutral"}>{STATUS_OPTIONS.find((item) => item.value === value)?.label ?? value}</Pill> : null,
      },
      { field: "questionCount", headerName: "Questions", width: 125, ...numberCol(), headerTooltip: "Active questions (online programs)" },
      { field: "enrollmentCount", headerName: "Enrollments", width: 135, ...numberCol() },
      { field: "startDate", headerName: "Starts", width: 125, ...dateCol() },
      { field: "endDate", headerName: "Ends", width: 125, ...dateCol() },
      {
        field: "examTime",
        headerName: "Exam time",
        width: 160,
        ...textCol(),
        cellRenderer: ({ value }: { value?: string }) => (value ? value : <Muted>—</Muted>),
      },
      {
        field: "venue",
        headerName: "Venue",
        width: 180,
        ...textCol(),
        cellRenderer: ({ value }: { value?: string }) => (value ? value : <Muted>—</Muted>),
      },
      {
        field: "classLevels",
        headerName: "Classes",
        width: 150,
        hide: true,
        ...setCol(adminClassLevelOptions, { sortable: false }),
        valueFormatter: ({ value }) => (Array.isArray(value) && value.length ? value.map((level) => `Class ${level}`).join(", ") : "All classes"),
        context: { exportValue: (row: Row) => (row.classLevels ?? []).join(" ") },
      },
      { field: "durationMinutes", headerName: "Duration (min)", width: 140, hide: true, ...numberCol() },
      { field: "totalMarks", headerName: "Total marks", width: 130, hide: true, ...numberCol() },
      { field: "featured", headerName: "Featured", width: 120, hide: true, ...setCol(yesNoOptions("Featured", "Not featured")), valueFormatter: ({ value }) => (value ? "Yes" : "No") },
      { field: "order", headerName: "Order", width: 100, hide: true, ...numberCol() },
      { field: "createdAt", headerName: "Created", width: 125, hide: true, ...dateCol() },
      { colId: "actions", headerName: "", width: 130, cellRenderer: ProgramActions },
    ],
    []
  );

  return (
    <>
      <SaDataGrid<Row>
        ref={grid}
        source={SOURCE}
        gridId={SOURCE}
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        context={{ view: setViewTarget, edit: openEdit, remove: setDeleteTarget }}
        searchPlaceholder="Search title, slug, venue or exam time…"
        emptyTitle="No programs found"
        emptyDescription="Try changing filters or create a new exam program."
        exportName="sage-exam-programs"
        toolbarActions={
          <>
            <button type="button" className="sa-grid-btn" onClick={() => openCreate("offline")}>
              <Plus size={15} /> <span className="sa-grid-btn-label">New offline</span>
            </button>
            <button type="button" className="sa-grid-btn primary" onClick={() => openCreate("online")}>
              <Plus size={15} /> <span className="sa-grid-btn-label">New online</span>
            </button>
          </>
        }
      />

      <Dialog open={sheetOpen} onOpenChange={(open) => !open && !savingProgram && closeSheet()}>
        <DialogContent
          size="xl"
          showCloseButton={!savingProgram}
          className={cn(
            "top-[max(1rem,3dvh)] flex h-[min(94dvh,880px)] w-[calc(100vw-1.5rem)] max-w-none translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border-sage-border/80 p-0 shadow-2xl",
            "sm:w-[min(calc(100vw-3rem),56rem)] lg:w-[min(calc(100vw-4rem),64rem)]",
            "data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4"
          )}
        >
          <DialogHeader className="shrink-0 space-y-3 border-b border-sage-border/70 bg-gradient-to-r from-white to-sage-cream/30 px-5 py-5 text-left sm:px-6">
            <div className="flex flex-wrap items-center gap-2 pr-8">
              <Badge
                className={cn(
                  "rounded-lg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                  createMode === "online"
                    ? "bg-sage-red-50 text-sage-primary ring-1 ring-sage-primary/20"
                    : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                )}
              >
                {createMode === "online" ? "Online MCQ" : "Offline center"}
              </Badge>
              {editing ? (
                <Badge variant="outline" className="rounded-lg capitalize">
                  {editing.status}
                </Badge>
              ) : null}
            </div>
            <DialogTitle className="text-xl font-bold text-sage-secondary">
              {editing ? "Edit exam program" : createMode === "online" ? "New online MCQ exam" : "New offline center exam"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-sage-gray-600">
              {createMode === "online"
                ? "Configure MCQ settings, payment, and publishing. Fields are validated before save."
                : "Add venue, exam time, syllabus, and schedule details for the center exam page."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-sage-cream/15 px-4 py-4 sm:px-6 sm:py-5">
            <ExamProgramForm
              formId="exam-program-form"
              hideActions
              initial={editing}
              defaultDeliveryMode={editing?.deliveryMode || createMode}
              onSavingChange={setSavingProgram}
              onSaved={(program) => {
                onProgramUpsert(program);
                reload();
                closeSheet();
                toast.success(editing ? "Exam program updated successfully" : "Exam program created successfully");
              }}
              onCancel={closeSheet}
            />
          </div>

          <DialogFooter className="-mx-0 -mb-0 shrink-0 gap-2 rounded-none border-t border-sage-border/70 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
            <Button type="button" variant="outline" className="rounded-xl" disabled={savingProgram} onClick={closeSheet}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="exam-program-form"
              disabled={savingProgram}
              className={cn(
                "rounded-xl font-semibold",
                createMode === "online" ? "bg-sage-primary hover:bg-sage-secondary" : "bg-amber-700 hover:bg-amber-800"
              )}
            >
              {savingProgram ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save program"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExamProgramViewModal
        program={viewTarget}
        open={Boolean(viewTarget)}
        onOpenChange={(open) => !open && setViewTarget(null)}
        onEdit={(program) => {
          setViewTarget(null);
          openEdit(program);
        }}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="size-5" />
            </div>
            <DialogTitle>Delete exam program?</DialogTitle>
            <DialogDescription className="text-left leading-relaxed">
              <strong>{deleteTarget?.title}</strong> and all related data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

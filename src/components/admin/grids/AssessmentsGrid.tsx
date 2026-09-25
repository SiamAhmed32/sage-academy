"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef } from "ag-grid-community";
import { Archive, CalendarDays, ClipboardCheck, Plus, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";

import { AssessmentFormModal } from "@/components/admin/assessments/AssessmentFormModal";
import type { AdminAssessmentItem, AssessmentKind } from "@/components/admin/assessments/types";
import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, dateCol, numberCol, setCol, textCol, type PillTone } from "@/components/admin/grid/cells";
import { adminClassLevelOptions, adminVersionLabels, getAdminClassLabel, getAdminStatusLabel } from "@/constants/admin-display";
import { examTypeOptions } from "@/schemas/assessment";
import { ConfirmDialog, ThumbTitle, readApiResult, requestGridRefresh, useGridRefreshListener, yesNoOptions, type ConfirmRequest } from "./shared";

type Row = Omit<AdminAssessmentItem, "_id"> & {
  id: string;
  /** Unique subjects across every class (for display and filtering). */
  subjects: string[];
  createdAt: string;
  updatedAt: string;
};

const KINDS: Record<AssessmentKind, { source: string; api: string; noun: string; plural: string; icon: typeof CalendarDays }> = {
  exam: { source: "exams", api: "/api/exams", noun: "exam", plural: "exams", icon: CalendarDays },
  modelTest: { source: "model-tests", api: "/api/model-tests", noun: "model test", plural: "model tests", icon: ClipboardCheck },
};

const CLASS_OPTIONS = adminClassLevelOptions.filter((option) => option.value >= 4 && option.value <= 12);
const VERSION_OPTIONS = (["bangla", "english", "both"] as const).map((value) => ({ value, label: adminVersionLabels[value] ?? value }));
const STATUS_OPTIONS = (["published", "draft", "hidden", "archived"] as const).map((value) => ({ value, label: getAdminStatusLabel(value) }));
const STATUS_TONES: Record<string, PillTone> = { published: "success", draft: "info", hidden: "warning", archived: "neutral" };

function toItem(row: Row): AdminAssessmentItem {
  return {
    _id: row.id,
    title: row.title,
    slug: row.slug,
    image: row.image,
    examType: row.examType || undefined,
    classLevels: row.classLevels,
    version: row.version,
    schoolFocus: row.schoolFocus,
    startDate: row.startDate,
    endDate: row.endDate,
    routineTitle: row.routineTitle,
    routineSubtitle: row.routineSubtitle,
    scheduleNote: row.scheduleNote,
    fees: row.fees,
    classSpecificInfo: row.classSpecificInfo,
    features: row.features,
    status: row.status,
    featured: row.featured,
    order: row.order,
  };
}

/** The update API replaces the whole record, so a status change re-sends every field. */
function statusPayload(row: Row, status: AdminAssessmentItem["status"], isExam: boolean) {
  const payload = new FormData();
  payload.set("title", row.title);
  payload.set("image", row.image || "");
  payload.set("slug", "");
  payload.set("classLevels", row.classLevels.join(","));
  payload.set("version", row.version);
  payload.set("schoolFocus", row.schoolFocus.join("\n"));
  payload.set("startDate", row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : "");
  payload.set("endDate", row.endDate ? new Date(row.endDate).toISOString().slice(0, 10) : "");
  payload.set("routineTitle", row.routineTitle || "");
  payload.set("routineSubtitle", row.routineSubtitle || "");
  payload.set("scheduleNote", row.scheduleNote || "");
  payload.set("feesJson", JSON.stringify(row.fees));
  payload.set("classSpecificInfoJson", JSON.stringify(row.classSpecificInfo || []));
  payload.set("features", row.features.join("\n"));
  payload.set("status", status);
  payload.set("order", String(row.order || 0));
  // Archiving drops the homepage "featured" flag, as before; a restore keeps whatever is stored.
  if (status !== "archived" && row.featured) payload.set("featured", "on");
  if (isExam) payload.set("examType", row.examType || "Regular Exam");
  return payload;
}

async function saveAssessment(kind: AssessmentKind, id: string | null, payload: FormData) {
  const { api } = KINDS[kind];
  await readApiResult(await fetch(id ? `${api}/${id}` : api, { method: id ? "PATCH" : "POST", body: payload }), "Could not save");
  toast.success(id ? "Updated successfully" : "Created successfully");
}

export function AssessmentsGrid({ kind, tiles }: { kind: AssessmentKind; tiles: GridTile[] }) {
  const router = useRouter();
  const gridRef = useRef<SaDataGridHandle>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const config = KINDS[kind];
  const isExam = kind === "exam";
  useGridRefreshListener(config.source, gridRef);
  // Stable object: the form modal resets itself whenever "editingItem" changes.
  const editingItem = useMemo(() => (editing ? toItem(editing) : null), [editing]);

  const reload = useCallback(() => {
    gridRef.current?.refresh(false);
    router.refresh();
  }, [router]);

  const runAction = useCallback(
    async (row: Row, action: "archive" | "restore" | "delete") => {
      try {
        const url = `${config.api}/${row.id}`;
        if (action === "delete") {
          await readApiResult(await fetch(`${url}?permanent=true`, { method: "DELETE" }), "Could not delete");
        } else {
          const payload = statusPayload(row, action === "archive" ? "archived" : "draft", isExam);
          await readApiResult(await fetch(url, { method: "PATCH", body: payload }), "Could not update");
        }
        toast.success(action === "archive" ? "Archived successfully" : action === "restore" ? "Restored as a draft" : "Deleted successfully");
        reload();
      } catch (error) {
        toast.error(error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.");
      }
    },
    [config.api, isExam, reload]
  );

  const columnDefs = useMemo<ColDef<Row>[]>(() => {
    const Icon = config.icon;
    const defs: ColDef<Row>[] = [
      {
        field: "title",
        headerName: isExam ? "Exam" : "Model test",
        minWidth: 260,
        flex: 1.4,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? <ThumbTitle image={data.image} icon={Icon} title={data.title} sub={data.slug} /> : null,
      },
      { field: "slug", headerName: "Slug", width: 180, hide: true, ...textCol() },
    ];
    if (isExam) {
      defs.push({
        field: "examType",
        headerName: "Exam type",
        width: 150,
        ...setCol(examTypeOptions.map((value) => ({ value, label: value }))),
      });
    }
    defs.push(
      {
        field: "classLevels",
        headerName: "Classes",
        width: 170,
        ...setCol(CLASS_OPTIONS),
        sortable: false,
        valueFormatter: ({ value }) => ((value as number[] | undefined)?.length ? (value as number[]).map(getAdminClassLabel).join(", ") : "—"),
        tooltipValueGetter: ({ data }) => data?.classLevels.map(getAdminClassLabel).join(", ") ?? "",
        context: { exportValue: (row: Row) => row.classLevels.map(getAdminClassLabel).join(" | ") },
      },
      {
        field: "version",
        headerName: "Version",
        width: 170,
        ...setCol(VERSION_OPTIONS),
        valueFormatter: ({ value }) => adminVersionLabels[String(value ?? "")] ?? String(value ?? ""),
      },
      {
        field: "subjects",
        headerName: "Subjects",
        minWidth: 200,
        flex: 1,
        ...textCol(),
        sortable: false,
        cellRenderer: ({ data }: { data?: Row }) =>
          !data ? null : data.subjects.length ? (
            <span>
              {data.subjects.slice(0, 5).join(", ")}
              {data.subjects.length > 5 ? <Muted> +{data.subjects.length - 5}</Muted> : null}
            </span>
          ) : (
            <Muted>No subjects</Muted>
          ),
        tooltipValueGetter: ({ data }) => data?.subjects.join(", ") ?? "",
        context: { exportValue: (row: Row) => row.subjects.join(" | ") },
      },
      {
        field: "schoolFocus",
        headerName: "School focus",
        minWidth: 180,
        flex: 1,
        ...textCol(),
        sortable: false,
        cellRenderer: ({ data }: { data?: Row }) =>
          !data ? null : data.schoolFocus.length ? <span>{data.schoolFocus.join(", ")}</span> : <Muted>All schools</Muted>,
        tooltipValueGetter: ({ data }) => data?.schoolFocus.join(", ") ?? "",
        context: { exportValue: (row: Row) => row.schoolFocus.join(" | ") },
      },
      { field: "startDate", headerName: "Starts", width: 125, ...dateCol() },
      { field: "endDate", headerName: "Ends", width: 125, ...dateCol() },
      {
        field: "status",
        headerName: "Status",
        width: 125,
        ...setCol(STATUS_OPTIONS),
        cellRenderer: ({ value }: { value?: string }) =>
          value ? <Pill tone={STATUS_TONES[value] ?? "neutral"}>{getAdminStatusLabel(value)}</Pill> : null,
        context: { exportValue: (row: Row) => getAdminStatusLabel(row.status) },
      },
      {
        field: "featured",
        headerName: "Homepage",
        width: 130,
        ...setCol(yesNoOptions("Featured", "Regular")),
        cellRenderer: ({ value }: { value?: boolean }) => (value ? <Pill tone="info">Featured</Pill> : <Muted>Regular</Muted>),
        context: { exportValue: (row: Row) => (row.featured ? "Featured" : "Regular") },
      },
      { field: "order", headerName: "Order", width: 95, ...numberCol() },
      { field: "createdAt", headerName: "Created", width: 125, hide: true, ...dateCol() },
      { field: "updatedAt", headerName: "Updated", width: 125, hide: true, ...dateCol() },
      {
        colId: "actions",
        headerName: "",
        width: 130,
        cellRenderer: ({ data }: { data?: Row }) =>
          !data ? null : (
            <ActionIcons
              onEdit={() => setEditing(data)}
              onDelete={() =>
                setConfirm({
                  title: "Delete permanently?",
                  description: `"${data.title}" and its related information will be permanently deleted. This cannot be undone.`,
                  confirmLabel: "Delete permanently",
                  danger: true,
                  run: () => runAction(data, "delete"),
                })
              }
            >
              {data.status === "archived" ? (
                <IconAction icon={RotateCcw} label="Restore as a draft" tone="success" onClick={() => runAction(data, "restore")} />
              ) : (
                <IconAction
                  icon={Archive}
                  label="Archive"
                  onClick={() =>
                    setConfirm({
                      title: "Archive this item?",
                      description: `"${data.title}" will move to the archive. You can edit or restore it later.`,
                      confirmLabel: "Archive",
                      run: () => runAction(data, "archive"),
                    })
                  }
                />
              )}
            </ActionIcons>
          ),
      }
    );
    return defs;
  }, [config.icon, isExam, runAction]);

  return (
    <>
      <SaDataGrid<Row>
        ref={gridRef}
        source={config.source}
        gridId={config.source}
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        rowHeight={52}
        searchPlaceholder={isExam ? "Search title, exam type, school or subject…" : "Search title, school or subject…"}
        emptyTitle={`No ${config.plural} found`}
        emptyDescription={`Clear the search or filters, or create a new ${config.noun}.`}
        exportName={`sage-${config.source}`}
      />

      {editing ? (
        <AssessmentFormModal
          open
          onClose={() => setEditing(null)}
          editingItem={editingItem}
          isExam={isExam}
          onSave={async (payload) => {
            await saveAssessment(kind, editing.id, payload);
            reload();
          }}
        />
      ) : null}

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

export function AssessmentCreateButton({ kind }: { kind: AssessmentKind }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isExam = kind === "exam";
  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={17} /> New {isExam ? "exam" : "model test"}
      </button>
      {open ? (
        <AssessmentFormModal
          open
          onClose={() => setOpen(false)}
          editingItem={null}
          isExam={isExam}
          onSave={async (payload) => {
            await saveAssessment(kind, null, payload);
            requestGridRefresh(KINDS[kind].source);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

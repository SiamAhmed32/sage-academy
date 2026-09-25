"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Archive, FileText, RotateCcw, User } from "lucide-react";
import { toast } from "react-toastify";

import {
  archiveAdmissionRequestAction,
  deleteAdmissionRequestAction,
  restoreAdmissionRequestAction,
  updateAdmissionRequestAction,
} from "@/app/admin/actions/admission";
import { AdmissionConfirmModal } from "@/components/admin/admissions/AdmissionConfirmModal";
import { AdmissionDetailModal } from "@/components/admin/admissions/AdmissionDetailModal";
import { AdmissionNoteModal } from "@/components/admin/admissions/AdmissionNoteModal";
import type { AdmissionRequestItem } from "@/components/admin/admissions/types";
import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, TitleCell, dateCol, setCol, textCol } from "@/components/admin/grid/cells";
import { adminGenderLabels, adminVersionLabels, getAdminClassLabel } from "@/constants/admin-display";
import { formatAdminDateTime } from "@/lib/admin-format";
import { ContactLinks, NoteCell, StatusPill, StatusSelectCell, type LeadContext } from "./lead-cells";

type Row = AdmissionRequestItem & { id: string };

type ConfirmType = "delete" | "archive" | "restore";

type AdmissionContext = LeadContext<Row> & {
  view: (row: Row) => void;
  confirm: (row: Row, type: ConfirmType) => void;
  canDelete: boolean;
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
  { value: "spam", label: "Spam" },
];

const CLASS_OPTIONS = ["5", "6", "7", "8", "9", "10", "11", "12"].map((value) => ({ value, label: getAdminClassLabel(value) }));

const CONFIRM_COPY: Record<ConfirmType, { title: string; message: string; label: string }> = {
  delete: { title: "Delete application?", message: "This application will be permanently deleted and cannot be recovered.", label: "Delete" },
  archive: { title: "Archive application?", message: "This application will move to the archived list and can be restored later.", label: "Archive" },
  restore: { title: "Restore application?", message: "This application will return to the active list.", label: "Restore" },
};

function AdmissionActions({ data, context }: ICellRendererParams<Row, unknown, AdmissionContext>) {
  if (!data) return null;
  return (
    <ActionIcons onView={() => context.view(data)} onDelete={data.isArchived && context.canDelete ? () => context.confirm(data, "delete") : undefined}>
      <ContactLinks phone={data.studentWhatsapp || data.phone} />
      <IconAction icon={FileText} label="Open full application" href={`/admin/admissions/${data.id}`} />
      {data.isArchived ? (
        <IconAction icon={RotateCcw} label="Restore" tone="success" onClick={() => context.confirm(data, "restore")} />
      ) : (
        <IconAction icon={Archive} label="Archive" tone="danger" onClick={() => context.confirm(data, "archive")} />
      )}
    </ActionIcons>
  );
}

export function AdmissionsGrid({ tiles, canDelete, initialSearch }: { tiles: GridTile[]; canDelete: boolean; initialSearch?: string }) {
  const router = useRouter();
  const grid = useRef<SaDataGridHandle>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [noteRow, setNoteRow] = useState<Row | null>(null);
  const [confirmState, setConfirmState] = useState<{ row: Row; type: ConfirmType } | null>(null);
  const [processing, setProcessing] = useState(false);

  const reload = useCallback(() => {
    grid.current?.refresh(false);
    router.refresh();
  }, [router]);

  const setStatus = useCallback(
    async (row: Row, status: string) => {
      const formData = new FormData();
      formData.append("id", row.id);
      formData.append("status", status);
      // The action writes both fields, so keep the saved comment.
      formData.append("adminNote", row.adminNote ?? "");
      try {
        const res = await updateAdmissionRequestAction(formData);
        if (!res.success) {
          toast.error(res.message || "Could not update the status");
          return false;
        }
        toast.success("Status updated");
        reload();
        return true;
      } catch {
        toast.error("Could not update the status");
        return false;
      }
    },
    [reload]
  );

  const context = useMemo<Omit<AdmissionContext, "refresh">>(
    () => ({
      setStatus,
      editNote: setNoteRow,
      view: setDetail,
      confirm: (row, type) => setConfirmState({ row, type }),
      canDelete,
    }),
    [setStatus, canDelete]
  );

  async function onConfirmAction() {
    if (!confirmState) return;
    const { row, type } = confirmState;
    setProcessing(true);
    try {
      const res =
        type === "archive"
          ? await archiveAdmissionRequestAction(row.id)
          : type === "restore"
            ? await restoreAdmissionRequestAction(row.id)
            : await deleteAdmissionRequestAction(row.id);
      if (res.success) {
        toast.success(type === "delete" ? "Application deleted" : type === "archive" ? "Application archived" : "Application restored");
        setConfirmState(null);
        reload();
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setProcessing(false);
    }
  }

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "studentName",
        headerName: "Applicant",
        minWidth: 230,
        flex: 1.3,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <TitleCell
              icon={User}
              title={data.studentName || "Applicant"}
              sub={`#${data.id.slice(-6).toUpperCase()}${data.guardianName ? ` · ${data.guardianName}` : ""}`}
              href={`/admin/admissions/${data.id}`}
            />
          ) : null,
      },
      {
        field: "className",
        headerName: "Class",
        width: 115,
        ...setCol(CLASS_OPTIONS),
        valueFormatter: ({ value }) => (value ? getAdminClassLabel(String(value)) : "—"),
      },
      { field: "phone", headerName: "Phone", width: 145, ...textCol() },
      { field: "studentWhatsapp", headerName: "WhatsApp", width: 145, hide: true, ...textCol() },
      { field: "guardianName", headerName: "Guardian", width: 170, hide: true, ...textCol() },
      { field: "email", headerName: "Email", width: 190, hide: true, ...textCol() },
      { field: "schoolName", headerName: "School", minWidth: 170, flex: 1, ...textCol() },
      {
        field: "academicVersion",
        headerName: "Version",
        width: 130,
        hide: true,
        ...setCol([
          { value: "bangla", label: "Bangla" },
          { value: "english", label: "English" },
          { value: "other", label: "Other" },
        ]),
        valueFormatter: ({ value }) => (value ? adminVersionLabels[String(value)] ?? String(value) : "—"),
      },
      {
        field: "studentGender",
        headerName: "Gender",
        width: 110,
        hide: true,
        ...setCol([
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "other", label: "Other" },
          { value: "", label: "Not given" },
        ]),
        valueFormatter: ({ value }) => (value ? adminGenderLabels[String(value)] ?? String(value) : "—"),
      },
      { field: "preferredBatch", headerName: "Preferred batch", width: 150, hide: true, ...textCol() },
      {
        field: "createdAt",
        headerName: "Applied",
        width: 175,
        ...dateCol(),
        valueFormatter: ({ value }) => (value ? formatAdminDateTime(String(value)) : "—"),
      },
      {
        field: "adminNote",
        headerName: "Comments",
        minWidth: 170,
        flex: 1,
        ...textCol(),
        cellRenderer: NoteCell,
      },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        ...setCol(STATUS_OPTIONS),
        cellRenderer: (params: ICellRendererParams<Row, unknown, AdmissionContext>) =>
          params.data?.isArchived ? (
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <StatusPill status={params.data.status} />
              <Muted>Archived</Muted>
            </span>
          ) : (
            <StatusSelectCell {...params} options={STATUS_OPTIONS} />
          ),
        context: { exportValue: (row: Row) => row.status },
      },
      { colId: "actions", headerName: "", width: 236, cellRenderer: AdmissionActions },
    ],
    []
  );

  const copy = confirmState ? CONFIRM_COPY[confirmState.type] : CONFIRM_COPY.archive;

  return (
    <>
      <SaDataGrid<Row>
        ref={grid}
        source="admissions"
        gridId="admissions"
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        context={context}
        initialSearch={initialSearch}
        searchPlaceholder="Search name, phone, guardian, email or school…"
        rowHref={(row) => `/admin/admissions/${row.id}`}
        emptyTitle="No applications found"
        emptyDescription="Adjust the search or filters and try again."
        exportName="sage-admissions"
      />

      {detail ? <AdmissionDetailModal item={detail} onClose={() => setDetail(null)} /> : null}

      {noteRow ? (
        <AdmissionNoteModal
          key={noteRow.id}
          id={noteRow.id}
          initialNote={noteRow.adminNote || ""}
          studentName={noteRow.studentName || "Applicant"}
          status={noteRow.status}
          onClose={() => setNoteRow(null)}
          onSaved={() => grid.current?.refresh(false)}
        />
      ) : null}

      <AdmissionConfirmModal
        isOpen={confirmState !== null}
        isProcessing={processing}
        type={confirmState?.type ?? "archive"}
        title={copy.title}
        message={copy.message}
        confirmLabel={copy.label}
        onClose={() => setConfirmState(null)}
        onConfirm={onConfirmAction}
      />
    </>
  );
}

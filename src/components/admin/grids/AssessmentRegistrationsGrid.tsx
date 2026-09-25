"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { ClipboardCheck, MessageSquare } from "lucide-react";
import { toast } from "react-toastify";

import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, TitleCell, dateCol, setCol, textCol } from "@/components/admin/grid/cells";
import { adminVersionLabels, getAdminStatusLabel } from "@/constants/admin-display";
import { formatAdminDateTime } from "@/lib/admin-format";
import { assessmentLeadStatusOptions } from "@/schemas/assessment";
import { ContactLinks, NoteCell, NoteModal, StatusSelectCell, type LeadContext } from "./lead-cells";

type Row = {
  id: string;
  assessmentKind: "modelTest" | "exam";
  assessmentId: string;
  assessmentTitle: string;
  assessmentType: string;
  name: string;
  phone: string;
  classLabel: string;
  version: string;
  schoolName: string;
  selectedSubjects: string[];
  applicantType: "sage" | "outside";
  message: string;
  status: string;
  adminNote: string;
  createdAt: string;
};

const STATUS_OPTIONS = assessmentLeadStatusOptions.map((value) => ({ value, label: getAdminStatusLabel(value) }));
const kindLabel = (kind: string) => (kind === "modelTest" ? "Model Test" : "Exam");

function RegistrationActions({ data, context }: ICellRendererParams<Row, unknown, LeadContext<Row>>) {
  if (!data) return null;
  return (
    <ActionIcons>
      <ContactLinks phone={data.phone} />
      <IconAction icon={MessageSquare} label="Follow-up note" onClick={() => context.editNote(data)} />
    </ActionIcons>
  );
}

export function AssessmentRegistrationsGrid({
  tiles,
  assessmentTypes,
  classLabels,
  initialSearch,
}: {
  tiles: GridTile[];
  assessmentTypes: string[];
  classLabels: string[];
  initialSearch?: string;
}) {
  const router = useRouter();
  const grid = useRef<SaDataGridHandle>(null);
  const [noteRow, setNoteRow] = useState<Row | null>(null);

  const update = useCallback(
    async (row: Row, payload: { status?: string; adminNote?: string }) => {
      try {
        const res = await fetch(`/api/assessment-registrations/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.message || "Update failed");
        toast.success("Updated");
        grid.current?.refresh(false);
        router.refresh();
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Update failed");
        return false;
      }
    },
    [router]
  );

  const context = useMemo<Omit<LeadContext<Row>, "refresh">>(
    () => ({
      setStatus: (row, status) => update(row, { status }),
      editNote: setNoteRow,
    }),
    [update]
  );

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "assessmentTitle",
        headerName: "Registration",
        minWidth: 240,
        flex: 1.3,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <TitleCell
              icon={ClipboardCheck}
              title={data.assessmentTitle}
              sub={`${data.assessmentType || kindLabel(data.assessmentKind)} · ${formatAdminDateTime(data.createdAt)}`}
            />
          ) : null,
      },
      {
        field: "assessmentKind",
        headerName: "Kind",
        width: 120,
        hide: true,
        ...setCol([
          { value: "modelTest", label: "Model Test" },
          { value: "exam", label: "Exam" },
        ]),
        valueFormatter: ({ value }) => kindLabel(String(value ?? "")),
      },
      {
        field: "assessmentType",
        headerName: "Type",
        width: 140,
        hide: true,
        ...setCol(assessmentTypes.map((value) => ({ value, label: value }))),
      },
      {
        field: "name",
        headerName: "Applicant",
        minWidth: 190,
        flex: 1,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? <TitleCell avatar={data.name} title={data.name} sub={data.phone} /> : null,
        context: { exportValue: (row: Row) => row.name },
      },
      { field: "phone", headerName: "Phone", width: 145, hide: true, ...textCol() },
      {
        field: "classLabel",
        headerName: "Class",
        width: 130,
        ...setCol(classLabels.map((value) => ({ value, label: value }))),
      },
      {
        field: "version",
        headerName: "Version",
        width: 150,
        ...setCol([
          { value: "bangla", label: "Bangla" },
          { value: "english", label: "English" },
          { value: "both", label: "Bangla and English" },
        ]),
        valueFormatter: ({ value }) => (value ? adminVersionLabels[String(value)] ?? String(value) : "—"),
      },
      { field: "schoolName", headerName: "School", minWidth: 160, flex: 1, ...textCol(), valueFormatter: ({ value }) => value || "Not provided" },
      {
        field: "applicantType",
        headerName: "Applicant type",
        width: 140,
        ...setCol([
          { value: "sage", label: "SAGE student" },
          { value: "outside", label: "Outside student" },
        ]),
        cellRenderer: ({ value }: { value?: string }) =>
          value === "sage" ? <Pill tone="success">SAGE student</Pill> : <Pill tone="neutral">Outside</Pill>,
        context: { exportValue: (row: Row) => (row.applicantType === "sage" ? "SAGE student" : "Outside student") },
      },
      {
        field: "selectedSubjects",
        headerName: "Subjects",
        minWidth: 180,
        flex: 1,
        ...textCol(),
        sortable: false,
        valueFormatter: ({ value }) => (Array.isArray(value) ? value.join(", ") : ""),
        tooltipValueGetter: ({ data }) => data?.selectedSubjects.join(", ") ?? "",
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? data.selectedSubjects.length ? <span>{data.selectedSubjects.join(", ")}</span> : <Muted>—</Muted> : null,
        context: { exportValue: (row: Row) => row.selectedSubjects.join("; ") },
      },
      {
        field: "message",
        headerName: "Message",
        minWidth: 180,
        flex: 1,
        tooltipField: "message",
        ...textCol(),
        cellRenderer: ({ value }: { value?: string }) => (value ? <span>{value}</span> : <Muted>—</Muted>),
      },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        ...setCol(STATUS_OPTIONS),
        cellRenderer: StatusSelectCell,
        cellRendererParams: { options: STATUS_OPTIONS },
      },
      { field: "adminNote", headerName: "Note", minWidth: 170, flex: 1, ...textCol(), cellRenderer: NoteCell },
      {
        field: "createdAt",
        headerName: "Registered",
        width: 175,
        hide: true,
        ...dateCol(),
        valueFormatter: ({ value }) => (value ? formatAdminDateTime(String(value)) : "—"),
      },
      { colId: "actions", headerName: "", width: 130, cellRenderer: RegistrationActions },
    ],
    [assessmentTypes, classLabels]
  );

  return (
    <>
      <SaDataGrid<Row>
        ref={grid}
        source="assessment-registrations"
        gridId="assessment-registrations"
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        context={context}
        initialSearch={initialSearch}
        searchPlaceholder="Search test, name, phone, school or subject…"
        emptyTitle="No registrations found"
        emptyDescription="Adjust the search or filters and try again."
        exportName="sage-assessment-registrations"
      />

      {noteRow ? (
        <NoteModal
          key={noteRow.id}
          title={noteRow.name}
          subtitle={`${noteRow.assessmentTitle} · ${noteRow.phone}`}
          initialNote={noteRow.adminNote}
          onClose={() => setNoteRow(null)}
          onSave={(adminNote) => update(noteRow, { adminNote })}
        />
      ) : null}
    </>
  );
}

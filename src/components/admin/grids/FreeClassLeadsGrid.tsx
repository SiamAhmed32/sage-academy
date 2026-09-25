"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Gift, MessageSquare } from "lucide-react";
import { toast } from "react-toastify";

import { updateFreeClassLeadAction } from "@/app/admin/actions";
import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Pill, TitleCell, dateCol, setCol, textCol } from "@/components/admin/grid/cells";
import { freeClassLeadStatusOptions } from "@/constants/admin";
import { freeClassOptions } from "@/constants/free-class";
import { formatAdminDateTime } from "@/lib/admin-format";
import { ContactLinks, NoteCell, NoteModal, StatusSelectCell, type LeadContext } from "./lead-cells";

type Row = {
  id: string;
  name: string;
  phone: string;
  classLabel: string;
  subject: string;
  status: string;
  adminNote: string;
  source: "guest" | "registered" | string;
  createdAt: string;
};

// The public form stores its own (Bangla) class label; admins read the English one.
const CLASS_LABELS: Record<string, string> = {
  "6": "Class 6",
  "7": "Class 7",
  "8": "Class 8",
  "9": "Class 9",
  "10": "Class 10",
  ssc: "SSC / Class 10",
  hsc1: "HSC first year",
  hsc2: "HSC second year",
  admission: "Admission test preparation",
  other: "Other",
};
const STORED_CLASS_LABELS = new Map<string, string>([
  ...freeClassOptions.map((option): [string, string] => [option.label, CLASS_LABELS[option.value] ?? option.value]),
  ["রেজিস্টার্ড অ্যাকাউন্ট", "Registered account (legacy)"], // admin-language-allow: persisted legacy class value
]);

const freeClassLabel =(stored: string) => STORED_CLASS_LABELS.get(stored) ?? stored;

function LeadActions({ data, context }: ICellRendererParams<Row, unknown, LeadContext<Row>>) {
  if (!data) return null;
  return (
    <ActionIcons>
      <ContactLinks phone={data.phone} />
      <IconAction icon={MessageSquare} label="Follow-up note" onClick={() => context.editNote(data)} />
    </ActionIcons>
  );
}

export function FreeClassLeadsGrid({ tiles, classLabels, initialSearch }: { tiles: GridTile[]; classLabels: string[]; initialSearch?: string }) {
  const router = useRouter();
  const grid = useRef<SaDataGridHandle>(null);
  const [noteRow, setNoteRow] = useState<Row | null>(null);

  const save = useCallback(
    async (row: Row, patch: { status?: string; adminNote?: string }, message: string) => {
      const formData = new FormData();
      formData.append("id", row.id);
      if (patch.status !== undefined) formData.append("status", patch.status);
      if (patch.adminNote !== undefined) formData.append("adminNote", patch.adminNote);
      try {
        await updateFreeClassLeadAction(formData);
        toast.success(message);
        grid.current?.refresh(false);
        router.refresh();
        return true;
      } catch {
        toast.error("Update failed");
        return false;
      }
    },
    [router]
  );

  const context = useMemo<Omit<LeadContext<Row>, "refresh">>(
    () => ({
      setStatus: (row, status) => save(row, { status }, "Status updated"),
      editNote: setNoteRow,
    }),
    [save]
  );

  const classOptions = useMemo(
    () =>
      classLabels
        .map((value) => ({ value, label: freeClassLabel(value) }))
        .sort((a, b) => a.label.localeCompare(b.label, "en")),
    [classLabels]
  );

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "name",
        headerName: "Student",
        minWidth: 210,
        flex: 1.1,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? <TitleCell icon={Gift} title={data.name} sub={formatAdminDateTime(data.createdAt)} /> : null,
      },
      { field: "phone", headerName: "Phone", width: 145, ...textCol() },
      {
        field: "classLabel",
        headerName: "Class",
        width: 170,
        ...setCol(classOptions),
        valueFormatter: ({ value }) => (value ? freeClassLabel(String(value)) : "—"),
      },
      { field: "subject", headerName: "Subject", minWidth: 150, flex: 1, ...textCol() },
      {
        field: "source",
        headerName: "Source",
        width: 120,
        ...setCol([
          { value: "guest", label: "Guest form" },
          { value: "registered", label: "Signed in" },
        ]),
        cellRenderer: ({ value }: { value?: string }) =>
          value === "registered" ? <Pill tone="info">Signed in</Pill> : <Pill tone="warning">Guest</Pill>,
        context: { exportValue: (row: Row) => (row.source === "registered" ? "Signed in" : "Guest") },
      },
      {
        field: "status",
        headerName: "Status",
        width: 175,
        ...setCol(freeClassLeadStatusOptions),
        cellRenderer: StatusSelectCell,
        cellRendererParams: { options: freeClassLeadStatusOptions },
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
      { colId: "actions", headerName: "", width: 130, cellRenderer: LeadActions },
    ],
    [classOptions]
  );

  return (
    <>
      <SaDataGrid<Row>
        ref={grid}
        source="free-class-leads"
        gridId="free-class-leads"
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        context={context}
        initialSearch={initialSearch}
        searchPlaceholder="Search name, phone, class or subject…"
        emptyTitle="No leads found"
        emptyDescription="Adjust the filters or clear the search and try again."
        exportName="sage-free-class-leads"
      />

      {noteRow ? (
        <NoteModal
          key={noteRow.id}
          title={noteRow.name}
          subtitle={`${noteRow.phone} · ${freeClassLabel(noteRow.classLabel)} · ${noteRow.subject}`}
          initialNote={noteRow.adminNote}
          onClose={() => setNoteRow(null)}
          onSave={(adminNote) => save(noteRow, { adminNote }, "Note saved")}
        />
      ) : null}
    </>
  );
}

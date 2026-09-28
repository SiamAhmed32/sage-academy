"use client";

import { useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import { Archive, Wallet } from "lucide-react";
import type { ICellRendererParams } from "ag-grid-community";

import { deleteStudentAction, setStudentArchivedAction } from "@/app/admin/academy/_actions/students";
import { ArchiveBanner, ArchivedRowActions, useArchiveView } from "@/components/admin/academy/archive";
import { useAction } from "@/components/admin/academy/use-action";
import { SaDataGrid, type GridContext } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, TitleCell, dateCol, moneyCol, numberCol, setCol, textCol } from "@/components/admin/grid/cells";
import { formatTaka } from "@/lib/academy/codes";
import { VERSION_SHORT } from "@/lib/academy/constants";

type Row = {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  guardianName: string;
  className: string;
  classLevel: number;
  batchCode: string;
  batchId: string;
  version: "bangla" | "english";
  gender: "male" | "female";
  subjects: number;
  due: number;
  status: "active" | "inactive";
  isArchived: boolean;
  admissionDate: string;
};

function StudentActions({ data, context }: ICellRendererParams<Row, unknown, GridContext>) {
  const { pending, run } = useAction();
  if (!data) return null;
  if (data.isArchived) {
    return (
      <ActionIcons viewHref={`/admin/academy/students/${data.id}`}>
        <ArchivedRowActions
          name={`${data.name} (${data.studentId})`}
          restore={() => setStudentArchivedAction(data.id, false)}
          remove={() => deleteStudentAction(data.id)}
          onDone={() => context.refresh()}
        />
      </ActionIcons>
    );
  }
  const canArchive = data.status === "inactive" && data.due <= 0;
  return (
    <ActionIcons viewHref={`/admin/academy/students/${data.id}`}>
      <IconAction icon={Wallet} label="Collect payment" href={`/admin/academy/payments?student=${data.id}`} tone="success" />
      {data.status === "inactive" ? (
        <IconAction
          icon={Archive}
          label={canArchive ? "Archive student" : "Collect or waive their dues before archiving"}
          tone="danger"
          disabled={pending || !canArchive}
          onClick={() => {
            if (!window.confirm(`Archive ${data.name}? They leave the student list; you can restore them from the archive.`)) return;
            run(() => setStudentArchivedAction(data.id, true), { onSuccess: () => context.refresh() });
          }}
        />
      ) : null}
    </ActionIcons>
  );
}

export function StudentsGrid({ tiles, classes, initialSearch }: { tiles: GridTile[]; classes: { level: number; name: string }[]; initialSearch?: string }) {
  const inArchive = useArchiveView();
  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "name",
        headerName: "Student",
        minWidth: 200,
        flex: 1.4,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? <TitleCell avatar={data.name} title={data.name} sub={data.studentId} href={`/admin/academy/students/${data.id}`} /> : null,
      },
      { field: "studentId", headerName: "Student ID", width: 130, hide: true, ...textCol(), cellRenderer: ({ value }: { value?: string }) => <code>{value}</code> },
      {
        field: "classLevel",
        headerName: "Class",
        width: 110, minWidth: 90,
        ...setCol(classes.map((item) => ({ value: item.level, label: item.name }))),
        valueFormatter: ({ data }) => data?.className ?? "",
        context: { exportValue: (row: Row) => row.className },
      },
      {
        field: "batchCode",
        headerName: "Batch",
        width: 140, minWidth: 104,
        ...textCol(),
        cellRenderer: ({ value }: { value?: string }) => (value ? <code>{value}</code> : <Muted>—</Muted>),
      },
      {
        field: "version",
        headerName: "Version",
        width: 110, minWidth: 90,
        ...setCol([
          { value: "bangla", label: "Bangla" },
          { value: "english", label: "English" },
        ]),
        valueFormatter: ({ value }) => (value ? VERSION_SHORT[value as Row["version"]] : ""),
      },
      {
        field: "gender",
        headerName: "Gender",
        width: 110,
        hide: true,
        ...setCol([
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
        ]),
        valueFormatter: ({ value }) => (value === "female" ? "Female" : "Male"),
      },
      {
        field: "guardianName",
        headerName: "Guardian",
        minWidth: 150,
        flex: 1,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? <TitleCell title={data.guardianName || "—"} sub={data.phone} /> : null,
        context: { exportValue: (row: Row) => `${row.guardianName} ${row.phone}`.trim() },
      },
      { field: "phone", headerName: "Phone", width: 140, hide: true, ...textCol() },
      { field: "subjects", headerName: "Subjects", width: 115, minWidth: 100, ...numberCol() },
      {
        field: "due",
        headerName: "Due",
        width: 120, minWidth: 100,
        ...moneyCol(),
        cellRenderer: ({ value }: { value?: number }) =>
          value && value > 0 ? <strong style={{ color: "#a04e14" }}>{formatTaka(value)}</strong> : <Muted>—</Muted>,
      },
      {
        field: "status",
        headerName: "Status",
        width: 115, minWidth: 96,
        ...setCol([
          { value: "active", label: "Active" },
          { value: "inactive", label: "Left" },
        ]),
        cellRenderer: ({ data }: { data?: Row }) =>
          !data ? null : data.status === "inactive" ? (
            <Pill tone="neutral">Left</Pill>
          ) : data.due > 0 ? (
            <Pill tone="warning">Due</Pill>
          ) : (
            <Pill tone="success">Active</Pill>
          ),
      },
      { field: "admissionDate", headerName: "Admitted", width: 130, hide: true, ...dateCol() },
      {
        colId: "actions",
        headerName: "",
        width: 132,
        cellRenderer: StudentActions,
      },
    ],
    [classes]
  );

  return (
    <>
    {inArchive ? <ArchiveBanner what="students" note="Only students who have left and owe nothing can be archived. Their receipts stay on record." /> : null}
    <SaDataGrid<Row>
      source="academy-students"
      gridId="academy-students"
      columnDefs={columnDefs}
      getRowId={(row) => row.id}
      key={inArchive ? "archived" : "list"}
      tiles={inArchive ? undefined : tiles}
      initialPreset={inArchive ? "archived" : ""}
      initialSearch={initialSearch}
      searchPlaceholder="Search name, student ID, guardian or phone…"
      rowHref={(row) => `/admin/academy/students/${row.id}`}
      emptyTitle="No students found"
      emptyDescription="Clear the search or filters, or register a new student."
      exportName="sage-students"
    />
    </>
  );
}

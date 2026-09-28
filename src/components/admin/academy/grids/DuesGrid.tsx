"use client";

import { useMemo, useRef } from "react";
import type { ColDef } from "ag-grid-community";
import { RefreshCw, Wallet } from "lucide-react";

import { generateMonthDuesAction } from "@/app/admin/academy/_actions/finance";
import { useAction } from "@/components/admin/academy/use-action";
import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, TitleCell, moneyCol, setCol, textCol } from "@/components/admin/grid/cells";
import { dueStatusLabel, dueTone } from "@/components/admin/sa/ui";
import { DUE_KIND_LABELS, type DueKind } from "@/lib/academy/constants";
import { currentMonthKey, formatTaka, monthLabel } from "@/lib/academy/codes";

type Row = {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  phone: string;
  batchCode: string;
  month: string;
  kind: DueKind;
  label: string;
  amount: number;
  paid: number;
  remaining: number;
  status: string;
};

export function DuesGrid({ tiles, months }: { tiles?: GridTile[]; months: string[] }) {
  const grid = useRef<SaDataGridHandle>(null);
  const { pending, run } = useAction();
  const month = currentMonthKey();

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "studentName",
        headerName: "Student",
        minWidth: 230,
        flex: 1.3,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <TitleCell
              avatar={data.studentName}
              title={data.studentName}
              sub={[data.studentCode, data.phone].filter(Boolean).join(" · ")}
              href={`/admin/academy/students/${data.studentId}?tab=billing`}
            />
          ) : null,
      },
      { field: "studentCode", headerName: "Student ID", width: 125, hide: true, ...textCol() },
      {
        field: "batchCode",
        headerName: "Batch",
        width: 150,
        ...textCol(),
        cellRenderer: ({ value }: { value?: string }) => (value ? <code>{value}</code> : <Muted>—</Muted>),
      },
      {
        field: "month",
        headerName: "Month",
        width: 125,
        ...setCol(months.map((value) => ({ value, label: monthLabel(value) }))),
        valueFormatter: ({ value }) => (value ? monthLabel(String(value), true) : ""),
      },
      {
        field: "kind",
        headerName: "Type",
        width: 120,
        ...setCol(Object.entries(DUE_KIND_LABELS).map(([value, label]) => ({ value, label }))),
        valueFormatter: ({ value }) => DUE_KIND_LABELS[value as DueKind] ?? String(value ?? ""),
      },
      {
        field: "label",
        headerName: "Bill",
        minWidth: 170,
        flex: 1,
        ...textCol(),
        valueFormatter: ({ data }) => (data ? data.label || DUE_KIND_LABELS[data.kind] : ""),
      },
      { field: "amount", headerName: "Amount", width: 125, ...moneyCol() },
      { field: "paid", headerName: "Paid", width: 115, ...moneyCol() },
      {
        field: "remaining",
        headerName: "Remaining",
        width: 130,
        ...moneyCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          !data ? null : data.status === "void" || data.remaining <= 0 ? (
            <Muted>—</Muted>
          ) : (
            <strong style={{ color: "#a04e14" }}>{formatTaka(data.remaining)}</strong>
          ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        ...setCol([
          { value: "unpaid", label: "Unpaid" },
          { value: "partial", label: "Partly paid" },
          { value: "paid", label: "Paid" },
          { value: "void", label: "Cancelled" },
        ]),
        cellRenderer: ({ value }: { value?: string }) => (value ? <Pill tone={dueTone(value)}>{dueStatusLabel(value)}</Pill> : null),
      },
      {
        colId: "actions",
        headerName: "",
        width: 100,
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <ActionIcons viewHref={`/admin/academy/students/${data.studentId}?tab=billing`}>
              {data.status === "unpaid" || data.status === "partial" ? (
                <IconAction icon={Wallet} label="Collect payment" href={`/admin/academy/payments?student=${data.studentId}`} tone="success" />
              ) : null}
            </ActionIcons>
          ) : null,
      },
    ],
    [months]
  );

  return (
    <SaDataGrid<Row>
      ref={grid}
      source="academy-dues"
      gridId="academy-dues"
      columnDefs={columnDefs}
      getRowId={(row) => row.id}
      tiles={tiles}
      searchPlaceholder="Search student, ID, batch or phone…"
      rowHref={(row) => `/admin/academy/students/${row.studentId}?tab=billing`}
      emptyTitle="No bills here"
      emptyDescription="Nothing matches this view. Pick another tile or clear the filters."
      exportName="sage-dues"
      toolbarActions={
        <button
          type="button"
          className="sa-grid-btn"
          disabled={pending}
          onClick={() => run(() => generateMonthDuesAction(month), { onSuccess: () => grid.current?.refresh() })}
        >
          <RefreshCw size={15} className={pending ? "sa-spin" : undefined} />
          <span className="sa-grid-btn-label">{pending ? "Checking…" : `Create ${monthLabel(month, true)} bills`}</span>
        </button>
      }
    />
  );
}

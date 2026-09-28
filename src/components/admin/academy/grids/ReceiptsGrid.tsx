"use client";

import { useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import { Receipt } from "lucide-react";

import { SaDataGrid } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, Pill, TitleCell, dateCol, moneyCol, setCol, textCol } from "@/components/admin/grid/cells";
import { DUE_KIND_LABELS, PAYMENT_METHOD_LABELS, type DueKind, type PaymentMethod } from "@/lib/academy/constants";
import { formatTaka, monthLabel } from "@/lib/academy/codes";

type Row = {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  batchCode: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  receivedBy: string;
  status: "valid" | "void";
  months: string[];
  kinds: DueKind[];
};

export function ReceiptsGrid({ tiles }: { tiles?: GridTile[] }) {
  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "receiptNo",
        headerName: "Receipt",
        minWidth: 170,
        width: 180,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <TitleCell icon={Receipt} title={<code>{data.receiptNo}</code>} sub={PAYMENT_METHOD_LABELS[data.method]} href={`/admin/academy/receipts/${data.receiptNo}`} />
          ) : null,
      },
      { field: "paidAt", headerName: "Date", width: 130, ...dateCol() },
      {
        field: "studentName",
        headerName: "Student",
        minWidth: 220,
        flex: 1.2,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <TitleCell
              avatar={data.studentName}
              title={data.studentName}
              sub={[data.studentCode, data.batchCode].filter(Boolean).join(" · ")}
              href={`/admin/academy/students/${data.studentId}`}
            />
          ) : null,
      },
      { field: "studentCode", headerName: "Student ID", width: 125, hide: true, ...textCol() },
      { field: "batchCode", headerName: "Batch", width: 150, hide: true, ...textCol() },
      {
        colId: "for",
        headerName: "For",
        minWidth: 180,
        flex: 1,
        sortable: false,
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <TitleCell
              title={data.kinds.map((kind) => DUE_KIND_LABELS[kind]).join(", ") || "—"}
              sub={data.months.map((value) => monthLabel(value, true)).join(", ")}
            />
          ) : null,
        context: { exportValue: (row: Row) => `${row.kinds.join("/")} ${row.months.join("/")}` },
      },
      {
        field: "method",
        headerName: "Method",
        width: 130,
        ...setCol(Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))),
        valueFormatter: ({ value }) => PAYMENT_METHOD_LABELS[value as PaymentMethod] ?? "",
      },
      {
        field: "amount",
        headerName: "Amount",
        width: 125,
        ...moneyCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <strong style={data.status === "void" ? { textDecoration: "line-through", color: "var(--muted)" } : undefined}>{formatTaka(data.amount)}</strong>
          ) : null,
      },
      { field: "receivedBy", headerName: "Received by", width: 150, ...textCol() },
      {
        field: "status",
        headerName: "Status",
        width: 110,
        ...setCol([
          { value: "valid", label: "Paid" },
          { value: "void", label: "Void" },
        ]),
        cellRenderer: ({ value }: { value?: string }) =>
          value === "void" ? <Pill tone="danger">Void</Pill> : value ? <Pill tone="success">Paid</Pill> : null,
      },
      {
        colId: "actions",
        headerName: "",
        width: 70,
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <ActionIcons viewHref={`/admin/academy/receipts/${data.receiptNo}`} />
          ) : null,
      },
    ],
    []
  );

  return (
    <SaDataGrid<Row>
      source="academy-receipts"
      gridId="academy-receipts"
      columnDefs={columnDefs}
      getRowId={(row) => row.id}
      tiles={tiles}
      searchPlaceholder="Search receipt no., student, ID, batch or transaction…"
      rowHref={(row) => `/admin/academy/receipts/${row.receiptNo}`}
      emptyTitle="No receipts found"
      emptyDescription="Receipts appear here after a payment is collected."
      exportName="sage-receipts"
    />
  );
}

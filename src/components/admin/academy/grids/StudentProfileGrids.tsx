"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { BookOpen, Eye, History, Receipt, Wallet } from "lucide-react";

import { AddChargeButton, SubjectRowActions, WaiveDueButton } from "@/components/admin/academy/StudentWidgets";
import { SaDataGrid } from "@/components/admin/grid/SaDataGrid";
import { ActionIcons, IconAction, Muted, Pill, TitleCell, dateCol, moneyCol, setCol, textCol } from "@/components/admin/grid/cells";
import { dueStatusLabel, dueTone } from "@/components/admin/sa/ui";
import { DUE_KIND_LABELS, PAYMENT_METHOD_LABELS, type DiscountType, type DueKind, type PaymentMethod } from "@/lib/academy/constants";
import { formatDate, formatTaka, monthLabel } from "@/lib/academy/codes";

// Grids for one student's profile tabs. Rows come from the grid endpoint,
// scoped by params.studentId; `version` reloads them after any change.

const GRID_HEIGHT = 440;

type Common = { studentId: string; version: string };

function monthOptions(months: string[]) {
  return [...new Set(months)].sort().reverse().map((value) => ({ value, label: monthLabel(value) }));
}

// ───────────── Subjects & fees ─────────────

type SubjectRow = {
  id: string;
  enrollmentId: string;
  name: string;
  teacherName: string;
  batchId: string;
  batchCode: string;
  transferred: boolean;
  fee: number;
  discount: number;
  discountType: DiscountType;
  discountValue: number;
  discountNote: string;
  discountText: string;
  monthly: number;
  startMonth: string;
  endMonth: string;
  status: "active" | "dropped";
};

export function StudentSubjectsGrid({ studentId, version, active }: Common & { active: boolean }) {
  const columnDefs = useMemo<ColDef<SubjectRow>[]>(
    () => [
      {
        field: "name",
        headerName: "Subject",
        minWidth: 200,
        flex: 1.3,
        ...textCol(),
        cellRenderer: ({ data }: { data?: SubjectRow }) =>
          data ? <TitleCell icon={BookOpen} title={data.name} sub={data.teacherName || "Teacher not set"} /> : null,
      },
      { field: "teacherName", headerName: "Teacher", width: 150, hide: true, ...textCol() },
      {
        field: "batchCode",
        headerName: "Batch",
        width: 140,
        ...textCol(),
        cellRenderer: ({ data }: { data?: SubjectRow }) =>
          data ? (
            <TitleCell
              title={
                <Link href={`/admin/academy/batches/${data.batchId}`}>
                  <code>{data.batchCode}</code>
                </Link>
              }
              sub={data.transferred ? "Transferred" : undefined}
            />
          ) : null,
      },
      { field: "fee", headerName: "Fee", width: 110, ...moneyCol() },
      {
        field: "discountText",
        headerName: "Discount",
        width: 150,
        ...textCol(),
        cellRenderer: ({ data }: { data?: SubjectRow }) =>
          !data ? null : data.discount > 0 ? <TitleCell title={<Pill tone="info">{data.discountText}</Pill>} sub={data.discountNote || undefined} /> : <Muted>—</Muted>,
      },
      {
        field: "monthly",
        headerName: "Monthly",
        width: 120,
        ...moneyCol(),
        cellRenderer: ({ value }: { value?: number }) => <strong>{formatTaka(value ?? 0)}</strong>,
      },
      {
        field: "startMonth",
        headerName: "Billed from",
        width: 130,
        ...textCol(),
        valueFormatter: ({ data }) =>
          data ? `${monthLabel(data.startMonth, true)}${data.status === "dropped" && data.endMonth ? ` – ${monthLabel(data.endMonth, true)}` : ""}` : "",
      },
      {
        field: "status",
        headerName: "Status",
        width: 110,
        ...setCol([
          { value: "active", label: "Active" },
          { value: "dropped", label: "Dropped" },
        ]),
        cellRenderer: ({ value }: { value?: string }) => (value === "dropped" ? <Pill tone="neutral">Dropped</Pill> : <Pill tone="success">Active</Pill>),
      },
      {
        colId: "actions",
        headerName: "",
        width: 130,
        cellRenderer: ({ data }: ICellRendererParams<SubjectRow>) =>
          data && data.status === "active" && active ? (
            <div className="sa-grid-actions">
              <SubjectRowActions
                compact
                studentId={studentId}
                row={{
                  enrollmentId: data.enrollmentId,
                  name: data.name,
                  fee: data.fee,
                  discountType: data.discountType,
                  discountValue: data.discountValue,
                  discountNote: data.discountNote,
                }}
              />
            </div>
          ) : null,
      },
    ],
    [studentId, active]
  );

  return (
    <SaDataGrid<SubjectRow>
      source="student-subjects"
      gridId="student-subjects"
      columnDefs={columnDefs}
      getRowId={(row) => row.id}
      params={{ studentId }}
      refreshKey={version}
      height={GRID_HEIGHT}
      searchPlaceholder="Search subject, teacher or batch…"
      emptyTitle="No subjects"
      emptyDescription="Add a subject to start billing."
      exportName="student-subjects"
    />
  );
}

// ───────────── Bills ─────────────

type DueRow = {
  id: string;
  month: string;
  advance: boolean;
  kind: DueKind;
  label: string;
  details: string;
  amount: number;
  paid: number;
  remaining: number;
  status: string;
};

export function StudentDuesGrid({
  studentId,
  version,
  months,
  counts,
}: Common & { months: string[]; counts: { all: number; open: number; owed: number } }) {
  const columnDefs = useMemo<ColDef<DueRow>[]>(
    () => [
      {
        field: "month",
        headerName: "Month",
        width: 130,
        ...setCol(monthOptions(months)),
        cellRenderer: ({ data }: { data?: DueRow }) =>
          data ? <TitleCell title={monthLabel(data.month, true)} sub={data.advance ? "Advance" : undefined} /> : null,
      },
      {
        field: "kind",
        headerName: "Type",
        width: 120,
        hide: true,
        ...setCol(Object.entries(DUE_KIND_LABELS).map(([value, label]) => ({ value, label }))),
        valueFormatter: ({ value }) => DUE_KIND_LABELS[value as DueKind] ?? "",
      },
      { field: "label", headerName: "Bill", width: 150, ...textCol() },
      {
        field: "details",
        headerName: "Details",
        minWidth: 220,
        flex: 1.4,
        sortable: false,
        ...textCol(),
        tooltipField: "details",
        cellRenderer: ({ value }: { value?: string }) => (value ? <span className="sa-grid-muted sa-grid-clip">{value}</span> : <Muted>—</Muted>),
      },
      { field: "amount", headerName: "Amount", width: 115, ...moneyCol() },
      { field: "paid", headerName: "Paid", width: 105, ...moneyCol() },
      {
        field: "remaining",
        headerName: "Remaining",
        width: 120,
        ...moneyCol(),
        cellRenderer: ({ data }: { data?: DueRow }) =>
          !data ? null : data.status === "void" || data.remaining <= 0 ? <Muted>—</Muted> : <strong style={{ color: "#a04e14" }}>{formatTaka(data.remaining)}</strong>,
      },
      {
        field: "status",
        headerName: "Status",
        width: 125,
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
        width: 70,
        cellRenderer: ({ data }: ICellRendererParams<DueRow>) =>
          data && data.status === "unpaid" && data.paid === 0 ? (
            <div className="sa-grid-actions">
              <WaiveDueButton dueId={data.id} label={`${monthLabel(data.month, true)} ${data.label}`} />
            </div>
          ) : null,
      },
    ],
    [months]
  );

  return (
    <SaDataGrid<DueRow>
      source="student-dues"
      gridId="student-dues"
      columnDefs={columnDefs}
      getRowId={(row) => row.id}
      params={{ studentId }}
      refreshKey={version}
      height={GRID_HEIGHT}
      tiles={[
        { key: "all", label: "All bills", value: counts.all, icon: "receipt", tone: "blue", preset: "" },
        { key: "open", label: "Unpaid & partly paid", value: counts.open, icon: "dues", tone: "amber", preset: "open", note: `${formatTaka(counts.owed)} still to pay` },
      ]}
      searchPlaceholder="Search bill, subject or month…"
      emptyTitle="No bills here"
      emptyDescription="Tuition is billed on the 1st of every month."
      exportName="student-bills"
      toolbarActions={
        <>
          <AddChargeButton studentId={studentId} />
          <Link href={`/admin/academy/payments?student=${studentId}`} className="sa-grid-btn primary">
            <Wallet size={15} /> <span className="sa-grid-btn-label">Collect</span>
          </Link>
        </>
      }
    />
  );
}

// ───────────── Receipts ─────────────

type ReceiptRow = {
  id: string;
  receiptNo: string;
  paidAt: string;
  months: string[];
  method: PaymentMethod;
  amount: number;
  receivedBy: string;
  status: "valid" | "void";
};

export function StudentReceiptsGrid({ studentId, version }: Common) {
  const columnDefs = useMemo<ColDef<ReceiptRow>[]>(
    () => [
      {
        field: "receiptNo",
        headerName: "Receipt",
        width: 170,
        ...textCol(),
        cellRenderer: ({ data }: { data?: ReceiptRow }) =>
          data ? <TitleCell icon={Receipt} title={<code>{data.receiptNo}</code>} href={`/admin/academy/receipts/${data.receiptNo}`} /> : null,
      },
      { field: "paidAt", headerName: "Date", width: 130, ...dateCol() },
      {
        colId: "monthsText",
        field: "months",
        headerName: "For",
        minWidth: 160,
        flex: 1,
        ...textCol(),
        valueFormatter: ({ data }) => (data ? data.months.map((value) => monthLabel(value, true)).join(", ") : ""),
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
        width: 120,
        ...moneyCol(),
        cellRenderer: ({ data }: { data?: ReceiptRow }) =>
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
        cellRenderer: ({ value }: { value?: string }) => (value === "void" ? <Pill tone="danger">Void</Pill> : <Pill tone="success">Paid</Pill>),
      },
      {
        colId: "actions",
        headerName: "",
        width: 70,
        cellRenderer: ({ data }: { data?: ReceiptRow }) =>
          data ? (
            <ActionIcons>
              <IconAction icon={Eye} label="View receipt" href={`/admin/academy/receipts/${data.receiptNo}`} />
            </ActionIcons>
          ) : null,
      },
    ],
    []
  );

  return (
    <SaDataGrid<ReceiptRow>
      source="student-receipts"
      gridId="student-receipts"
      columnDefs={columnDefs}
      getRowId={(row) => row.id}
      params={{ studentId }}
      refreshKey={version}
      height={GRID_HEIGHT}
      rowHref={(row) => `/admin/academy/receipts/${row.receiptNo}`}
      searchPlaceholder="Search receipt no., month or method…"
      emptyTitle="No payments yet"
      emptyDescription="Receipts appear here after a payment is collected."
      exportName="student-receipts"
    />
  );
}

// ───────────── Activity ─────────────

type ActivityRow = { id: string; message: string; action: string; type: string; by: string; at: string };

const ACTIVITY_TYPES = [
  { value: "payment", label: "Payments" },
  { value: "discount", label: "Discounts" },
  { value: "subjects", label: "Subjects" },
  { value: "bills", label: "Bills" },
  { value: "profile", label: "Profile" },
];

const ACTIVITY_TONE: Record<string, "success" | "info" | "warning" | "neutral"> = {
  payment: "success",
  discount: "info",
  subjects: "warning",
  bills: "warning",
  profile: "neutral",
};

export function StudentActivityGrid({ studentId, version }: Common) {
  const columnDefs = useMemo<ColDef<ActivityRow>[]>(
    () => [
      {
        field: "message",
        headerName: "What happened",
        minWidth: 360,
        flex: 4,
        ...textCol(),
        tooltipField: "message",
        cellRenderer: ({ data }: { data?: ActivityRow }) => (data ? <TitleCell icon={History} title={<span className="sa-grid-clip">{data.message}</span>} /> : null),
      },
      {
        field: "type",
        headerName: "Type",
        width: 120,
        maxWidth: 150,
        ...setCol(ACTIVITY_TYPES),
        cellRenderer: ({ value }: { value?: string }) =>
          value ? <Pill tone={ACTIVITY_TONE[value] ?? "neutral"}>{ACTIVITY_TYPES.find((item) => item.value === value)?.label ?? value}</Pill> : null,
      },
      { field: "by", headerName: "By", width: 140, maxWidth: 180, ...textCol() },
      {
        field: "at",
        headerName: "When",
        width: 130,
        maxWidth: 160,
        ...dateCol(),
        valueFormatter: ({ value }) => (value ? formatDate(String(value)) : ""),
      },
    ],
    []
  );

  return (
    <SaDataGrid<ActivityRow>
      source="student-activity"
      gridId="student-activity"
      columnDefs={columnDefs}
      getRowId={(row) => row.id}
      params={{ studentId }}
      refreshKey={version}
      height={GRID_HEIGHT}
      searchPlaceholder="Search activity…"
      emptyTitle="No activity yet"
      emptyDescription="Admissions, payments, discounts and transfers are logged here."
      exportName="student-activity"
    />
  );
}

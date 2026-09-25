"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { ClipboardCheck } from "lucide-react";

import type { ExamProgramOption } from "@/components/admin/exam-hub/ExamHubManager";
import { ExamEnrollmentReviewModal } from "@/components/admin/exam-hub/ExamEnrollmentReviewModal";
import { useExamHubTiles } from "@/components/admin/exam-hub/use-exam-hub-tiles";
import { SaDataGrid, type GridContext, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import {
  ActionIcons,
  IconAction,
  Muted,
  Pill,
  TitleCell,
  dateCol,
  moneyCol,
  numberCol,
  setCol,
  textCol,
  type PillTone,
} from "@/components/admin/grid/cells";
import { ButtonTitle, yesNoOptions } from "@/components/admin/grids/shared";

const SOURCE = "exam-enrollments";

type Row = {
  id: string;
  programId: string;
  programTitle: string;
  programSlug: string;
  name: string;
  phone: string;
  email: string;
  classLabel: string;
  schoolName: string;
  feeAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  transactionId: string;
  proofUrl: string;
  hasProof: boolean;
  status: string;
  attemptsUsed: number;
  adminNote: string;
  createdAt: string;
  verifiedAt: string;
};

type EnrollmentsContext = GridContext & { open: (row: Row, mode: "view" | "review") => void };

const paymentStatusLabels: Record<string, string> = {
  not_required: "No payment required",
  pending: "Payment pending",
  submitted: "Payment submitted",
  verified: "Verified",
  rejected: "Rejected",
};

const paymentStatusTones: Record<string, PillTone> = {
  not_required: "neutral",
  pending: "neutral",
  submitted: "warning",
  verified: "success",
  rejected: "danger",
};

const statusLabels: Record<string, string> = { pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled" };
const statusTones: Record<string, PillTone> = { pending: "warning", confirmed: "success", cancelled: "neutral" };
const methodLabels: Record<string, string> = { bkash: "bKash", cash: "Cash", other: "Other" };

const needsReview = (row: Row) => row.paymentStatus === "submitted";

function EnrollmentActions({ data, context }: ICellRendererParams<Row, unknown, EnrollmentsContext>) {
  if (!data) return null;
  return (
    <ActionIcons onView={() => context.open(data, "view")}>
      {needsReview(data) ? (
        <IconAction icon={ClipboardCheck} label="Review payment" tone="success" onClick={() => context.open(data, "review")} />
      ) : null}
    </ActionIcons>
  );
}

export function ExamEnrollmentPanel({ programs, tiles: initialTiles }: { programs: ExamProgramOption[]; tiles: GridTile[] }) {
  const router = useRouter();
  const grid = useRef<SaDataGridHandle>(null);
  const [programId, setProgramId] = useState("");
  const { tiles, reload: reloadTiles } = useExamHubTiles("enrollments", programId, initialTiles);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "review">("view");

  const params = useMemo(() => (programId ? { programId } : undefined), [programId]);
  const shownProgram = useRef("");
  useEffect(() => {
    if (shownProgram.current === programId) return;
    shownProgram.current = programId;
    grid.current?.refresh();
  }, [programId]);

  function openModal(row: Row, mode: "view" | "review") {
    setSelectedId(row.id);
    setModalMode(mode);
    setModalOpen(true);
  }

  function reload() {
    grid.current?.refresh(false);
    void reloadTiles();
    router.refresh();
  }

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "name",
        headerName: "Student",
        minWidth: 230,
        flex: 1.3,
        ...textCol(),
        cellRenderer: ({ data, context }: ICellRendererParams<Row, unknown, EnrollmentsContext>) =>
          data ? (
            <ButtonTitle onClick={() => context.open(data, needsReview(data) ? "review" : "view")}>
              <TitleCell avatar={data.name} title={data.name} sub={`${data.phone} · ${data.classLabel}`} />
            </ButtonTitle>
          ) : null,
      },
      { field: "phone", headerName: "Phone", width: 140, hide: true, ...textCol() },
      { field: "email", headerName: "Email", width: 200, hide: true, ...textCol() },
      { field: "classLabel", headerName: "Class", width: 120, hide: true, ...textCol() },
      { field: "schoolName", headerName: "School", width: 200, hide: true, ...textCol() },
      { field: "programTitle", headerName: "Exam", minWidth: 200, flex: 1, ...textCol() },
      { field: "feeAmount", headerName: "Fee", width: 115, ...moneyCol() },
      {
        field: "paymentStatus",
        headerName: "Payment",
        width: 175,
        ...setCol(Object.entries(paymentStatusLabels).map(([value, label]) => ({ value, label }))),
        cellRenderer: ({ value }: { value?: string }) =>
          value ? <Pill tone={paymentStatusTones[value] ?? "neutral"}>{paymentStatusLabels[value] ?? value}</Pill> : null,
        context: { exportValue: (row: Row) => paymentStatusLabels[row.paymentStatus] ?? row.paymentStatus },
      },
      {
        field: "paymentMethod",
        headerName: "Method",
        width: 115,
        hide: true,
        ...setCol(Object.entries(methodLabels).map(([value, label]) => ({ value, label }))),
        valueFormatter: ({ value }) => (value ? (methodLabels[value as string] ?? String(value)) : "—"),
      },
      {
        field: "transactionId",
        headerName: "Transaction ID",
        width: 160,
        ...textCol(),
        cellRenderer: ({ value }: { value?: string }) => (value ? <code>{value}</code> : <Muted>—</Muted>),
      },
      {
        field: "hasProof",
        headerName: "Proof",
        width: 110,
        ...setCol(yesNoOptions("Has proof", "No proof")),
        cellRenderer: ({ data, context }: ICellRendererParams<Row, unknown, EnrollmentsContext>) =>
          data ? (
            data.hasProof ? (
              <button type="button" className="text-button" onClick={() => context.open(data, needsReview(data) ? "review" : "view")}>
                View
              </button>
            ) : (
              <Muted>—</Muted>
            )
          ) : null,
        context: { exportValue: (row: Row) => row.proofUrl },
      },
      {
        field: "status",
        headerName: "Enrollment",
        width: 130,
        ...setCol(Object.entries(statusLabels).map(([value, label]) => ({ value, label }))),
        cellRenderer: ({ value }: { value?: string }) =>
          value ? <Pill tone={statusTones[value] ?? "neutral"}>{statusLabels[value] ?? value}</Pill> : null,
      },
      { field: "attemptsUsed", headerName: "Attempts used", width: 140, hide: true, ...numberCol() },
      { field: "createdAt", headerName: "Submitted", width: 130, ...dateCol() },
      { field: "verifiedAt", headerName: "Reviewed", width: 130, hide: true, ...dateCol() },
      { colId: "actions", headerName: "", width: 110, cellRenderer: EnrollmentActions },
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
        initialPreset="review"
        params={params}
        context={{ open: openModal }}
        searchPlaceholder="Search student, phone, email, transaction or exam…"
        emptyTitle="No enrollments found"
        emptyDescription="No enrollments match the selected filters."
        exportName="sage-exam-enrollments"
        toolbarActions={
          <select
            className="sa-grid-cell-select"
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
            aria-label="Exam program"
            style={{ height: 36, maxWidth: 260 }}
          >
            <option value="">All programs</option>
            {programs.map((program) => (
              <option key={program._id} value={program._id}>
                {program.title}
              </option>
            ))}
          </select>
        }
      />

      <ExamEnrollmentReviewModal
        enrollmentId={selectedId}
        mode={modalMode}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdated={reload}
      />
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { toast } from "react-toastify";

import type { ExamProgramOption } from "@/components/admin/exam-hub/ExamHubManager";
import { useExamHubTiles } from "@/components/admin/exam-hub/use-exam-hub-tiles";
import { SaDataGrid, type GridContext, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, Muted, Pill, TitleCell, dateCol, numberCol, setCol, textCol, type PillTone } from "@/components/admin/grid/cells";
import { ButtonTitle } from "@/components/admin/grids/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAdminDateTime, formatAdminNumber } from "@/lib/admin-format";

const SOURCE = "exam-attempts";

type Row = {
  id: string;
  programId: string;
  programTitle: string;
  programSlug: string;
  name: string;
  phone: string;
  status: string;
  score: number;
  totalMarks: number;
  percent: number | null;
  durationSeconds: number;
  startedAt: string;
  expiresAt: string;
  submittedAt: string;
  ip: string;
};

type AttemptDetail = {
  _id: string;
  programTitle: string;
  name: string;
  phone: string;
  score: number;
  totalMarks: number;
  status: string;
  answers: Array<{
    questionText: string;
    image?: string;
    options: { text: string }[];
    correctIndex: number | null;
    selectedIndex: number | null;
    isCorrect: boolean | null;
    marksAwarded: number;
  }>;
};

type AttemptsContext = GridContext & { view: (row: Row) => void };

const attemptStatusLabels: Record<string, string> = {
  submitted: "Submitted",
  in_progress: "In progress",
  expired: "Expired",
};

const attemptStatusTones: Record<string, PillTone> = {
  submitted: "success",
  in_progress: "info",
  expired: "warning",
};

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return minutes ? `${minutes}m ${String(rest).padStart(2, "0")}s` : `${rest}s`;
}

function AttemptActions({ data, context }: ICellRendererParams<Row, unknown, AttemptsContext>) {
  if (!data) return null;
  return <ActionIcons onView={() => context.view(data)} />;
}

export function ExamAttemptPanel({ programs, tiles: initialTiles }: { programs: ExamProgramOption[]; tiles: GridTile[] }) {
  const grid = useRef<SaDataGridHandle>(null);
  const [programId, setProgramId] = useState("");
  const { tiles } = useExamHubTiles("attempts", programId, initialTiles);
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const onlinePrograms = useMemo(() => programs.filter((program) => program.deliveryMode === "online"), [programs]);

  const params = useMemo(() => (programId ? { programId } : undefined), [programId]);
  const shownProgram = useRef("");
  useEffect(() => {
    if (shownProgram.current === programId) return;
    shownProgram.current = programId;
    grid.current?.refresh();
  }, [programId]);

  async function openDetail(row: Row) {
    const res = await fetch(`/api/admin/exam-hub/attempts/${row.id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(typeof data?.message === "string" ? data.message : "Could not load the exam attempt");
      return;
    }
    setDetail(data.data);
  }

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "name",
        headerName: "Student",
        minWidth: 220,
        flex: 1.2,
        ...textCol(),
        cellRenderer: ({ data, context }: ICellRendererParams<Row, unknown, AttemptsContext>) =>
          data ? (
            <ButtonTitle onClick={() => context.view(data)}>
              <TitleCell avatar={data.name} title={data.name} sub={data.phone} />
            </ButtonTitle>
          ) : null,
      },
      { field: "phone", headerName: "Phone", width: 140, hide: true, ...textCol() },
      { field: "programTitle", headerName: "Exam", minWidth: 200, flex: 1, ...textCol() },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        ...setCol(Object.entries(attemptStatusLabels).map(([value, label]) => ({ value, label }))),
        cellRenderer: ({ value }: { value?: string }) =>
          value ? <Pill tone={attemptStatusTones[value] ?? "neutral"}>{attemptStatusLabels[value] ?? value}</Pill> : null,
      },
      {
        field: "score",
        headerName: "Score",
        width: 120,
        ...numberCol(),
        valueFormatter: ({ data }) =>
          data && data.status === "submitted" ? `${formatAdminNumber(data.score)}/${formatAdminNumber(data.totalMarks)}` : "—",
        context: { exportValue: (row: Row) => row.score },
      },
      { field: "totalMarks", headerName: "Total marks", width: 125, hide: true, ...numberCol() },
      {
        field: "percent",
        headerName: "Percent",
        width: 115,
        ...numberCol(),
        valueFormatter: ({ data, value }) => (data?.status === "submitted" && value != null ? `${value}%` : "—"),
      },
      {
        field: "durationSeconds",
        headerName: "Time taken",
        width: 125,
        ...numberCol(),
        valueFormatter: ({ value }) => formatDuration(Number(value) || 0),
      },
      {
        field: "startedAt",
        headerName: "Started",
        width: 175,
        hide: true,
        ...dateCol({ valueFormatter: ({ value }) => (value ? formatAdminDateTime(String(value), "—") : "—") }),
      },
      {
        field: "submittedAt",
        headerName: "Submitted",
        width: 175,
        ...dateCol({ valueFormatter: ({ value }) => (value ? formatAdminDateTime(String(value), "—") : "—") }),
      },
      {
        field: "ip",
        headerName: "IP address",
        width: 140,
        hide: true,
        ...textCol(),
        cellRenderer: ({ value }: { value?: string }) => (value ? <code>{value}</code> : <Muted>—</Muted>),
      },
      { colId: "actions", headerName: "", width: 80, cellRenderer: AttemptActions },
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
        initialPreset="submitted"
        params={params}
        context={{ view: openDetail }}
        searchPlaceholder="Search student, phone, IP address or exam…"
        emptyTitle="No attempts found"
        emptyDescription="No attempts match the selected filters."
        exportName="sage-exam-attempts"
        toolbarActions={
          <select
            className="sa-grid-cell-select"
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
            aria-label="Exam program"
            style={{ height: 36, maxWidth: 260 }}
          >
            <option value="">All programs</option>
            {onlinePrograms.map((program) => (
              <option key={program._id} value={program._id}>
                {program.title}
              </option>
            ))}
          </select>
        }
      />

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>{detail.programTitle}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-sage-gray-600">
                {detail.name} · {detail.phone} · {detail.score}/{detail.totalMarks}
              </p>
              <div className="mt-4 space-y-4">
                {detail.answers.map((answer, idx) => (
                  <div key={idx} className="rounded-xl border border-sage-border p-4">
                    <p className="font-semibold text-sage-secondary">
                      Question {idx + 1}. {answer.questionText}
                    </p>
                    {answer.image ? (
                      <div className="relative mt-3 aspect-[4/3] max-h-56 w-full overflow-hidden rounded-xl bg-sage-cream ring-1 ring-sage-border">
                        <Image src={answer.image} alt="" fill className="object-contain p-2" unoptimized />
                      </div>
                    ) : null}
                    <ul className="mt-2 space-y-1 text-sm">
                      {answer.options.map((opt, optIdx) => (
                        <li
                          key={optIdx}
                          className={
                            optIdx === answer.correctIndex
                              ? "font-semibold text-emerald-700"
                              : optIdx === answer.selectedIndex
                                ? "text-sage-primary"
                                : "text-sage-gray-700"
                          }
                        >
                          {String.fromCharCode(65 + optIdx)}. {opt.text}
                          {optIdx === answer.selectedIndex ? " (selected)" : ""}
                          {optIdx === answer.correctIndex ? " (correct)" : ""}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-sage-gray-500">
                      Marks: {answer.marksAwarded} · {answer.isCorrect ? "Correct" : "Incorrect / blank"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

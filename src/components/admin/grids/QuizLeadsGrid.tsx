"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { MessageSquare, Trophy } from "lucide-react";
import { toast } from "react-toastify";

import { updateQuizSubmissionAction } from "@/app/admin/actions";
import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, TitleCell, dateCol, numberCol, setCol, textCol } from "@/components/admin/grid/cells";
import { getAdminClassLabel } from "@/constants/admin-display";
import { formatAdminDateTime, formatAdminNumber } from "@/lib/admin-format";
import { ContactLinks, NoteCell, NoteModal, StatusSelectCell, type LeadContext } from "./lead-cells";

type Row = {
  id: string;
  name: string;
  phone: string;
  classLevel: number;
  score: number;
  totalQuestions: number;
  whatsappRequested: boolean;
  status: string;
  adminNote: string;
  createdAt: string;
  answers: { isCorrect: boolean; questionText: string; explanation: string }[];
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "invalid", label: "Invalid" },
  { value: "qualified", label: "Qualified" },
];

/** Result message sent to the lead on WhatsApp. It is written in Bangla on purpose: the leads read Bangla. */
function resultMessage(lead: Row) {
  const answers = lead.answers
    .map((answer, index) => {
      // admin-language-allow-start: outreach copy sent to Bangla-speaking leads
      return `\nQ${index + 1}: ${answer.questionText}\nসঠিক উত্তর ও ব্যাখ্যা: ${answer.explanation || "সঠিক উত্তর দেয়া হয়েছে।"}`;
      // admin-language-allow-end
    })
    .join("\n");
  // admin-language-allow-start: outreach copy sent to Bangla-speaking leads
  return `আসসালামু আলাইকুম ${lead.name}!
SAGE Academy-র কুইজে অংশগ্রহণের জন্য ধন্যবাদ।
আপনার কুইজ স্কোর: ${lead.score}/${lead.totalQuestions}।

সঠিক উত্তর এবং ব্যাখ্যাগুলো নিচে দেয়া হলো:
${answers}

আপনার একাডেমিক প্রস্তুতির জন্য কোনো সহযোগিতার প্রয়োজন হলে আমাদের জানান। ধন্যবাদ!`;
  // admin-language-allow-end
}

function QuizActions({ data, context }: ICellRendererParams<Row, unknown, LeadContext<Row>>) {
  if (!data) return null;
  return (
    <ActionIcons>
      <ContactLinks phone={data.phone} whatsappText={resultMessage(data)} />
      <IconAction icon={MessageSquare} label="Follow-up note" onClick={() => context.editNote(data)} />
    </ActionIcons>
  );
}

export function QuizLeadsGrid({
  tiles,
  classOptions,
  initialSearch,
}: {
  tiles: GridTile[];
  classOptions: { value: string; label: string }[];
  initialSearch?: string;
}) {
  const router = useRouter();
  const grid = useRef<SaDataGridHandle>(null);
  const [noteRow, setNoteRow] = useState<Row | null>(null);

  /** The action writes status and note together, so always send both. */
  const save = useCallback(
    async (row: Row, patch: { status?: string; adminNote?: string }, message: string) => {
      const formData = new FormData();
      formData.append("id", row.id);
      formData.append("status", patch.status ?? row.status);
      formData.append("adminNote", patch.adminNote ?? row.adminNote ?? "");
      try {
        await updateQuizSubmissionAction(formData);
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

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "name",
        headerName: "Student",
        minWidth: 210,
        flex: 1.2,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? <TitleCell icon={Trophy} title={data.name} sub={formatAdminDateTime(data.createdAt)} /> : null,
      },
      { field: "phone", headerName: "Phone", width: 145, ...textCol() },
      {
        field: "classLevel",
        headerName: "Class",
        width: 115,
        ...setCol(classOptions),
        valueFormatter: ({ value }) => (value ? getAdminClassLabel(Number(value)) : "—"),
      },
      {
        field: "score",
        headerName: "Score",
        width: 115,
        ...numberCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <strong>
              {formatAdminNumber(data.score)}/{formatAdminNumber(data.totalQuestions)}
            </strong>
          ) : null,
        context: { exportValue: (row: Row) => `${row.score}/${row.totalQuestions}` },
      },
      { field: "totalQuestions", headerName: "Questions", width: 115, hide: true, ...numberCol() },
      {
        field: "whatsappRequested",
        headerName: "WhatsApp?",
        width: 125,
        ...setCol([
          { value: "true", label: "Requested" },
          { value: "false", label: "Not requested" },
        ]),
        cellRenderer: ({ value }: { value?: boolean }) => (value ? <Pill tone="success">Yes</Pill> : <Muted>No</Muted>),
        context: { exportValue: (row: Row) => (row.whatsappRequested ? "Yes" : "No") },
      },
      {
        field: "status",
        headerName: "Status",
        width: 145,
        ...setCol(STATUS_OPTIONS),
        cellRenderer: StatusSelectCell,
        cellRendererParams: { options: STATUS_OPTIONS },
      },
      { field: "adminNote", headerName: "Note", minWidth: 170, flex: 1, ...textCol(), cellRenderer: NoteCell },
      {
        field: "createdAt",
        headerName: "Submitted",
        width: 175,
        hide: true,
        ...dateCol(),
        valueFormatter: ({ value }) => (value ? formatAdminDateTime(String(value)) : "—"),
      },
      { colId: "actions", headerName: "", width: 130, cellRenderer: QuizActions },
    ],
    [classOptions]
  );

  return (
    <>
      <SaDataGrid<Row>
        ref={grid}
        source="quiz-leads"
        gridId="quiz-leads"
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        context={context}
        initialSearch={initialSearch}
        searchPlaceholder="Search name or phone…"
        emptyTitle="No quiz leads found"
        emptyDescription="Adjust the search or filters and try again."
        exportName="sage-quiz-leads"
      />

      {noteRow ? (
        <NoteModal
          key={noteRow.id}
          title={noteRow.name}
          subtitle={`${noteRow.phone} · ${getAdminClassLabel(noteRow.classLevel)} · Score ${noteRow.score}/${noteRow.totalQuestions}`}
          initialNote={noteRow.adminNote}
          onClose={() => setNoteRow(null)}
          onSave={(adminNote) => save(noteRow, { adminNote }, "Note saved")}
        />
      ) : null}
    </>
  );
}

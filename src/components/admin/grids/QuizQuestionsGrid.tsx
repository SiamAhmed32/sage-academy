"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef } from "ag-grid-community";
import { CircleCheck, CircleOff, HelpCircle, Plus } from "lucide-react";
import { toast } from "react-toastify";

import { deleteQuizQuestionAction, saveQuizQuestionAction } from "@/app/admin/actions";
import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, TitleCell, dateCol, numberCol, setCol, textCol } from "@/components/admin/grid/cells";
import { QuizQuestionForm } from "@/components/admin/quizzes/QuizQuestionForm";
import type { AdminQuizQuestion } from "@/components/admin/quizzes/types";
import { Modal } from "@/components/admin/sa/Modal";
import { adminClassLevelOptions, getAdminClassLabel } from "@/constants/admin-display";
import { ButtonTitle, ConfirmDialog, requestGridRefresh, useGridRefreshListener, type ConfirmRequest } from "./shared";

const SOURCE = "quiz-questions";

const CLASS_OPTIONS = adminClassLevelOptions.filter((option) => option.value >= 5 && option.value <= 12);

type Row = {
  id: string;
  classLevel: number;
  questionText: string;
  options: { text: string; isCorrect: boolean }[];
  correctAnswer: string;
  optionCount: number;
  explanation: string;
  isActive: boolean;
  status: "active" | "inactive";
  order: number;
  createdAt: string;
  updatedAt: string;
};

function toQuestion(row: Row): AdminQuizQuestion {
  return {
    _id: row.id,
    classLevel: row.classLevel,
    questionText: row.questionText,
    options: row.options,
    explanation: row.explanation,
    isActive: row.isActive,
    order: row.order,
  };
}

export function QuizQuestionsGrid({ tiles }: { tiles: GridTile[] }) {
  const router = useRouter();
  const gridRef = useRef<SaDataGridHandle>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  useGridRefreshListener(SOURCE, gridRef);

  const reload = useCallback(() => {
    gridRef.current?.refresh(false);
    router.refresh();
  }, [router]);

  const toggleActive = useCallback(
    async (row: Row) => {
      try {
        const result = await saveQuizQuestionAction({ id: row.id, isActive: !row.isActive });
        if (!result.ok) throw new Error(result.message);
        toast.success(row.isActive ? "Question hidden from the quiz" : "Question shown in the quiz");
        reload();
      } catch {
        toast.error("Could not update the question");
      }
    },
    [reload]
  );

  const remove = useCallback(
    async (row: Row) => {
      try {
        const result = await deleteQuizQuestionAction(row.id);
        if (!result.ok) throw new Error(result.message);
        toast.success("Question deleted");
        reload();
      } catch {
        toast.error("Could not delete the question");
      }
    },
    [reload]
  );

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "questionText",
        headerName: "Question",
        minWidth: 320,
        flex: 2,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <ButtonTitle onClick={() => setEditing(data)}>
              <TitleCell icon={HelpCircle} title={data.questionText} sub={data.explanation ? `Explanation: ${data.explanation}` : undefined} />
            </ButtonTitle>
          ) : null,
        tooltipValueGetter: ({ data }) => data?.questionText ?? "",
      },
      {
        field: "classLevel",
        headerName: "Class",
        width: 120,
        ...setCol(CLASS_OPTIONS),
        valueFormatter: ({ value }) => (value ? getAdminClassLabel(Number(value)) : "—"),
      },
      {
        field: "correctAnswer",
        headerName: "Correct answer",
        minWidth: 180,
        flex: 1,
        ...textCol(),
        cellRenderer: ({ value }: { value?: string }) => (value ? <span style={{ fontWeight: 600 }}>{value}</span> : <Muted>Not set</Muted>),
      },
      { field: "optionCount", headerName: "Options", width: 105, ...numberCol() },
      {
        field: "explanation",
        headerName: "Explanation",
        minWidth: 200,
        flex: 1,
        hide: true,
        ...textCol(),
        tooltipValueGetter: ({ data }) => data?.explanation ?? "",
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        ...setCol([
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]),
        cellRenderer: ({ value }: { value?: string }) =>
          value === "inactive" ? <Pill tone="neutral">Inactive</Pill> : <Pill tone="success">Active</Pill>,
      },
      { field: "order", headerName: "Order", width: 95, hide: true, ...numberCol() },
      { field: "createdAt", headerName: "Created", width: 125, ...dateCol() },
      { field: "updatedAt", headerName: "Updated", width: 125, hide: true, ...dateCol() },
      {
        colId: "actions",
        headerName: "",
        width: 130,
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <ActionIcons
              onEdit={() => setEditing(data)}
              onDelete={() =>
                setConfirm({
                  title: "Delete this question permanently?",
                  description: "The question and its answer options will be deleted. This cannot be undone.",
                  confirmLabel: "Delete permanently",
                  danger: true,
                  run: () => remove(data),
                })
              }
            >
              <IconAction
                icon={data.isActive ? CircleOff : CircleCheck}
                label={data.isActive ? "Hide from the quiz" : "Show in the quiz"}
                tone={data.isActive ? undefined : "success"}
                onClick={() => toggleActive(data)}
              />
            </ActionIcons>
          ) : null,
      },
    ],
    [remove, toggleActive]
  );

  return (
    <>
      <SaDataGrid<Row>
        ref={gridRef}
        source={SOURCE}
        gridId={SOURCE}
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        rowHeight={52}
        searchPlaceholder="Search questions, answers or explanations…"
        emptyTitle="No quiz questions found"
        emptyDescription="Clear the search or filters, or add a new question."
        exportName="sage-quiz-questions"
      />

      {editing ? (
        <Modal open wide onClose={() => setEditing(null)} eyebrow="Quiz" title="Edit question">
          <QuizQuestionForm
            key={editing.id}
            initialData={toQuestion(editing)}
            onSaved={(_saved, closeForm) => {
              reload();
              if (closeForm) setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      ) : null}

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

export function QuizQuestionCreateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={17} /> New question
      </button>
      {open ? (
        <Modal open wide onClose={() => setOpen(false)} eyebrow="Quiz" title="Add quiz questions" description="Create one or more questions for a class.">
          <QuizQuestionForm
            onSaved={(_saved, closeForm) => {
              requestGridRefresh(SOURCE);
              router.refresh();
              if (closeForm) setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </Modal>
      ) : null}
    </>
  );
}

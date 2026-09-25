"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Eye, EyeOff, FileQuestion, ImageIcon, Plus, Upload } from "lucide-react";
import { toast } from "react-toastify";

import type { ExamProgramOption } from "@/components/admin/exam-hub/ExamHubManager";
import { useExamHubTiles } from "@/components/admin/exam-hub/use-exam-hub-tiles";
import { SaDataGrid, type GridContext, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import { ActionIcons, IconAction, Pill, dateCol, numberCol, setCol, textCol } from "@/components/admin/grid/cells";
import { ButtonTitle, ConfirmDialog, ThumbTitle, yesNoOptions, type ConfirmRequest } from "@/components/admin/grids/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SOURCE = "exam-questions";

type Row = {
  id: string;
  programId: string;
  questionText: string;
  image: string;
  options: { text: string }[];
  optionCount: number;
  correctIndex: number;
  explanation: string;
  marks: number;
  order: number;
  isActive: boolean;
  status: "active" | "inactive";
  hasImage: boolean;
  createdAt: string;
  updatedAt: string;
};

type QuestionsContext = GridContext & {
  edit: (row: Row) => void;
  remove: (row: Row) => void;
  toggle: (row: Row) => void;
};

const emptyForm = {
  questionText: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  marks: 1,
  order: 0,
  isActive: true,
};

const letter = (index: number) => String.fromCharCode(65 + index);

function QuestionActions({ data, context }: ICellRendererParams<Row, unknown, QuestionsContext>) {
  if (!data) return null;
  return (
    <ActionIcons onEdit={() => context.edit(data)} onDelete={() => context.remove(data)}>
      <IconAction
        icon={data.isActive ? EyeOff : Eye}
        label={data.isActive ? "Deactivate (hide from exam)" : "Activate (show in exam)"}
        tone={data.isActive ? undefined : "success"}
        onClick={() => context.toggle(data)}
      />
    </ActionIcons>
  );
}

export function ExamQuestionPanel({
  programs,
  selectedProgramId,
  onSelectProgram,
}: {
  programs: ExamProgramOption[];
  selectedProgramId: string;
  onSelectProgram: (id: string) => void;
}) {
  const router = useRouter();
  const grid = useRef<SaDataGridHandle>(null);
  const { tiles, reload: reloadTiles } = useExamHubTiles("questions", selectedProgramId);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Row | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState("");
  const [activatingAll, setActivatingAll] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const params = useMemo(() => (selectedProgramId ? { programId: selectedProgramId } : undefined), [selectedProgramId]);
  const shownProgram = useRef(selectedProgramId);
  useEffect(() => {
    if (shownProgram.current === selectedProgramId) return;
    shownProgram.current = selectedProgramId;
    grid.current?.refresh();
  }, [selectedProgramId]);

  function reload() {
    grid.current?.refresh(false);
    void reloadTiles();
    router.refresh();
  }

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
    setImageFile(null);
    setExistingImage("");
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    resetForm();
  }

  function openCreate() {
    resetForm();
    setFormOpen(true);
  }

  function startEdit(question: Row) {
    setEditing(question);
    setImageFile(null);
    setExistingImage(question.image || "");
    setForm({
      questionText: question.questionText,
      options: [
        question.options[0]?.text || "",
        question.options[1]?.text || "",
        question.options[2]?.text || "",
        question.options[3]?.text || "",
      ],
      correctIndex: question.correctIndex,
      marks: question.marks,
      order: question.order,
      isActive: question.isActive !== false,
    });
    setFormOpen(true);
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProgramId) return;

    const options = form.options.filter(Boolean).map((text) => ({ text }));
    if (options.length < 2) {
      toast.error("At least two options are required");
      return;
    }

    const fd = new FormData();
    fd.append("questionText", form.questionText);
    fd.append("options", JSON.stringify(options));
    fd.append("correctIndex", String(form.correctIndex));
    fd.append("marks", String(form.marks));
    fd.append("order", String(form.order));
    fd.append("isActive", String(form.isActive));
    // The form has no explanation field; send the saved one so an edit keeps it.
    if (editing?.explanation) fd.append("explanation", editing.explanation);
    if (existingImage && !imageFile) fd.append("image", existingImage);
    if (!existingImage && !imageFile) fd.append("image", "");
    if (imageFile) fd.append("imageFile", imageFile);

    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/exam-hub/questions/${editing.id}` : `/api/admin/exam-hub/programs/${selectedProgramId}/questions`,
        {
          method: editing ? "PATCH" : "POST",
          body: fd,
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Could not save the exam question");
        return;
      }
      toast.success(editing ? "Question updated" : "Question added");
      setFormOpen(false);
      resetForm();
      reload();
    } finally {
      setSaving(false);
    }
  }

  function askDelete(row: Row) {
    setConfirm({
      title: "Delete this question?",
      description: `"${row.questionText.slice(0, 120)}" will be removed from the question bank.`,
      confirmLabel: "Delete question",
      danger: true,
      run: async () => {
        const res = await fetch(`/api/admin/exam-hub/questions/${row.id}`, { method: "DELETE" });
        if (!res.ok) {
          toast.error("Could not delete the exam question");
          return;
        }
        toast.success("Question deleted");
        if (editing?.id === row.id) resetForm();
        reload();
      },
    });
  }

  async function toggleActive(row: Row) {
    // Send the whole question: a partial update would reset marks and order to their defaults.
    const res = await fetch(`/api/admin/exam-hub/questions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionText: row.questionText,
        image: row.image,
        options: row.options,
        correctIndex: row.correctIndex,
        explanation: row.explanation,
        marks: row.marks,
        order: row.order,
        isActive: !row.isActive,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(typeof data?.message === "string" ? data.message : "Could not update the exam question");
      return;
    }
    toast.success(row.isActive ? "Question hidden from the exam" : "Question is active in the exam");
    reload();
  }

  async function activateAllQuestions() {
    if (!selectedProgramId) return;
    setActivatingAll(true);
    try {
      const res = await fetch(`/api/admin/exam-hub/programs/${selectedProgramId}/questions/activate-all`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Could not activate the exam questions");
        return;
      }
      toast.success(typeof data?.message === "string" ? data.message : "Questions activated");
      reload();
    } finally {
      setActivatingAll(false);
    }
  }

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        colId: "index",
        headerName: "#",
        width: 70,
        sortable: false,
        valueGetter: ({ node }) => (node?.rowIndex ?? 0) + 1,
      },
      {
        field: "questionText",
        headerName: "Question",
        minWidth: 320,
        flex: 2,
        ...textCol(),
        tooltipField: "questionText",
        cellRenderer: ({ data, context }: ICellRendererParams<Row, unknown, QuestionsContext>) =>
          data ? (
            <ButtonTitle onClick={() => context.edit(data)}>
              <ThumbTitle
                image={data.image}
                icon={FileQuestion}
                title={data.questionText}
                sub={data.isActive ? `Correct: ${letter(data.correctIndex)}. ${data.options[data.correctIndex]?.text ?? ""}` : "Inactive — hidden from exam"}
              />
            </ButtonTitle>
          ) : null,
      },
      {
        field: "optionCount",
        headerName: "Options",
        width: 110,
        ...numberCol(),
      },
      {
        field: "correctIndex",
        headerName: "Correct",
        width: 110,
        ...numberCol(),
        valueFormatter: ({ value }) => (value == null ? "—" : letter(Number(value))),
      },
      { field: "marks", headerName: "Marks", width: 100, ...numberCol() },
      { field: "order", headerName: "Order", width: 100, ...numberCol() },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        ...setCol([
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]),
        cellRenderer: ({ value }: { value?: string }) =>
          value === "inactive" ? <Pill tone="warning">Inactive</Pill> : <Pill tone="success">Active</Pill>,
      },
      {
        field: "hasImage",
        headerName: "Image",
        width: 110,
        hide: true,
        ...setCol(yesNoOptions("With image", "No image")),
        valueFormatter: ({ value }) => (value ? "Yes" : "No"),
      },
      { field: "createdAt", headerName: "Added", width: 125, hide: true, ...dateCol() },
      { field: "updatedAt", headerName: "Updated", width: 125, hide: true, ...dateCol() },
      { colId: "actions", headerName: "", width: 130, cellRenderer: QuestionActions },
    ],
    []
  );

  const selectedProgram = programs.find((p) => p._id === selectedProgramId);
  const tileValue = (key: string) => Number(tiles.find((tile) => tile.key === key)?.value ?? 0) || 0;
  const totalCount = tileValue("all");
  const activeCount = tileValue("active");
  const inactiveCount = tileValue("inactive");
  const sortedPrograms = [...programs].sort((a, b) => {
    if (a.status === "published" && b.status !== "published") return -1;
    if (b.status === "published" && a.status !== "published") return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-sage-border bg-white p-4">
        <Label>Select online program</Label>
        <Select value={selectedProgramId} onValueChange={onSelectProgram}>
          <SelectTrigger className="mt-2 max-w-xl">
            <SelectValue placeholder="Choose program" />
          </SelectTrigger>
          <SelectContent>
            {sortedPrograms.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.title} · {p.status} · /{p.slug}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProgram && selectedProgram.status !== "published" ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            This program is <strong>{selectedProgram.status}</strong>. Students only see <strong>published</strong> exams on the website — add
            questions to the published program with slug <code className="rounded bg-white px-1">/{selectedProgram.slug}</code>.
          </p>
        ) : null}
      </div>

      {selectedProgramId ? (
        <>
          {inactiveCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-900">
                <strong>{inactiveCount}</strong> inactive {inactiveCount === 1 ? "question is" : "questions are"} hidden from the public exam (
                {activeCount} active / {totalCount} total).
              </p>
              <Button
                type="button"
                size="sm"
                disabled={activatingAll}
                className="bg-sage-primary hover:bg-sage-secondary"
                onClick={activateAllQuestions}
              >
                {activatingAll ? "Activating..." : "Activate all questions"}
              </Button>
            </div>
          ) : null}

          <SaDataGrid<Row>
            ref={grid}
            source={SOURCE}
            gridId={SOURCE}
            columnDefs={columnDefs}
            getRowId={(row) => row.id}
            tiles={tiles}
            params={params}
            context={{ edit: startEdit, remove: askDelete, toggle: toggleActive }}
            searchPlaceholder="Search question text, options or explanation…"
            emptyTitle="No questions yet"
            emptyDescription="Add the first MCQ for this program, or clear the search and filters."
            exportName="sage-exam-questions"
            toolbarActions={
              <button type="button" className="sa-grid-btn primary" onClick={openCreate}>
                <Plus size={15} /> <span className="sa-grid-btn-label">Add MCQ</span>
              </button>
            }
          />
        </>
      ) : (
        <p className="text-sm text-sage-gray-500">Select an online program to manage questions.</p>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}>
        <DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl">
          <form onSubmit={saveQuestion} className="flex max-h-[92vh] flex-col">
            <DialogHeader className="shrink-0 border-b border-sage-border bg-sage-cream/30 px-5 py-4 text-left">
              <DialogTitle className="text-xl font-bold text-sage-secondary">{editing ? "Edit MCQ" : "Add MCQ"}</DialogTitle>
              <DialogDescription className="text-sm text-sage-gray-600">
                {selectedProgram ? `${selectedProgram.title} · /${selectedProgram.slug}` : "Choose a program first."}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <Label>Question</Label>
                <Textarea required rows={3} value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} />
              </div>
              <QuestionImageField
                existingImage={existingImage}
                imageFile={imageFile}
                onFileChange={setImageFile}
                onClearExisting={() => setExistingImage("")}
              />
              <div className="grid gap-3 md:grid-cols-2">
                {form.options.map((opt, idx) => (
                  <div key={idx}>
                    <Label>Option {letter(idx)}</Label>
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const options = [...form.options];
                        options[idx] = e.target.value;
                        setForm({ ...form, options });
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label>Correct option</Label>
                  <Select value={String(form.correctIndex)} onValueChange={(v) => setForm({ ...form, correctIndex: Number(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {form.options.map((_, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          {letter(idx)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Marks</Label>
                  <Input type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Order</Label>
                  <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 pb-2 text-sm font-medium">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                    Active (visible in exam)
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-sage-border bg-sage-cream/20 p-4">
              <Button type="button" variant="outline" disabled={saving} onClick={closeForm}>
                {editing ? "Cancel edit" : "Cancel"}
              </Button>
              <Button type="submit" disabled={saving || !selectedProgramId} className="bg-sage-primary hover:bg-sage-secondary">
                {saving ? "Saving..." : editing ? "Update question" : "Add question"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}

function QuestionImageField({
  existingImage,
  imageFile,
  onFileChange,
  onClearExisting,
}: {
  existingImage: string;
  imageFile: File | null;
  onFileChange: (file: File | null) => void;
  onClearExisting: () => void;
}) {
  const previewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const displaySrc = previewUrl || existingImage || "";
  const hasPreview = Boolean(displaySrc);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      onFileChange(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a JPG, PNG, or WEBP image");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or less");
      e.target.value = "";
      return;
    }
    onFileChange(file);
  }

  return (
    <div className="space-y-2">
      <Label>Question image (optional)</Label>
      <p className="text-xs text-sage-gray-500">Upload a graph, diagram, or figure to show with the question.</p>
      <div className="grid gap-4 rounded-2xl border border-sage-border bg-sage-cream/30 p-4 lg:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sage-border bg-white px-4 py-6 text-center transition hover:border-sage-primary/40 hover:bg-sage-red-50/40">
            <Upload className="size-5 text-sage-primary" />
            <span className="text-sm font-semibold text-sage-secondary">{imageFile ? "Choose a different image" : "Upload question image"}</span>
            <span className="text-xs text-sage-gray-500">JPG, PNG, WEBP · max 5MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
          </label>
          {imageFile ? (
            <p className="text-sm text-sage-gray-600">
              Selected: <span className="font-semibold text-sage-secondary">{imageFile.name}</span>
            </p>
          ) : null}
          {hasPreview ? (
            <div className="flex flex-wrap gap-2">
              {imageFile ? (
                <Button type="button" variant="outline" size="sm" onClick={() => onFileChange(null)}>
                  Clear new upload
                </Button>
              ) : null}
              {existingImage ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onFileChange(null);
                    onClearExisting();
                  }}
                >
                  Remove image
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white ring-1 ring-sage-border">
          {hasPreview ? (
            <Image src={displaySrc} alt="Question preview" fill className="object-contain p-1" unoptimized />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sage-gray-400">
              <ImageIcon className="size-7" />
              <p className="text-xs font-medium">Graph / diagram preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

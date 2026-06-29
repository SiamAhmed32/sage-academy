"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon, Upload } from "lucide-react";
import { toast } from "react-toastify";

import type { AdminExamProgram } from "@/components/admin/exam-hub/ExamHubManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Question = {
  _id: string;
  questionText: string;
  image?: string;
  options: { text: string }[];
  correctIndex: number;
  marks: number;
  order: number;
  isActive: boolean;
};

const emptyForm = {
  questionText: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  marks: 1,
  order: 0,
  isActive: true,
};

export function ExamQuestionPanel({
  programs,
  selectedProgramId,
  onSelectProgram,
}: {
  programs: AdminExamProgram[];
  selectedProgramId: string;
  onSelectProgram: (id: string) => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState("");
  const [activatingAll, setActivatingAll] = useState(false);

  useEffect(() => {
    if (!selectedProgramId) return;
    setLoading(true);
    fetch(`/api/admin/exam-hub/programs/${selectedProgramId}/questions`)
      .then((r) => r.json())
      .then((data) => setQuestions(data.data || []))
      .finally(() => setLoading(false));
  }, [selectedProgramId]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
    setExistingImage("");
  }

  function startEdit(question: Question) {
    setEditingId(question._id);
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
    if (existingImage && !imageFile) fd.append("image", existingImage);
    if (!existingImage && !imageFile) fd.append("image", "");
    if (imageFile) fd.append("imageFile", imageFile);

    setSaving(true);
    try {
      const res = await fetch(
        editingId
          ? `/api/admin/exam-hub/questions/${editingId}`
          : `/api/admin/exam-hub/programs/${selectedProgramId}/questions`,
        {
          method: editingId ? "PATCH" : "POST",
          body: fd,
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Save failed");
        return;
      }

      if (editingId) {
        setQuestions((prev) => prev.map((q) => (q._id === editingId ? data.data : q)));
        toast.success("Question updated");
      } else {
        setQuestions((prev) => [...prev, data.data]);
        toast.success("Question added");
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  async function removeQuestion(id: string) {
    const res = await fetch(`/api/admin/exam-hub/questions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    setQuestions((prev) => prev.filter((q) => q._id !== id));
    if (editingId === id) resetForm();
  }

  async function activateAllQuestions() {
    if (!selectedProgramId) return;
    setActivatingAll(true);
    try {
      const res = await fetch(
        `/api/admin/exam-hub/programs/${selectedProgramId}/questions/activate-all`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Could not activate questions");
        return;
      }
      setQuestions((prev) => prev.map((q) => ({ ...q, isActive: true })));
      toast.success(typeof data?.message === "string" ? data.message : "Questions activated");
    } finally {
      setActivatingAll(false);
    }
  }

  const selectedProgram = programs.find((p) => p._id === selectedProgramId);
  const activeCount = questions.filter((q) => q.isActive !== false).length;
  const inactiveCount = questions.filter((q) => q.isActive === false).length;
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
            This program is <strong>{selectedProgram.status}</strong>. Students only see{" "}
            <strong>published</strong> exams on the website — add questions to the published program with slug{" "}
            <code className="rounded bg-white px-1">/{selectedProgram.slug}</code>.
          </p>
        ) : null}
      </div>

      {selectedProgramId ? (
        <>
          {inactiveCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-900">
                <strong>{inactiveCount}</strong> question(s) are <strong>Inactive</strong> and hidden from the public exam
                ({activeCount} active / {questions.length} total).
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
          <form onSubmit={saveQuestion} className="space-y-4 rounded-xl border border-sage-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-sage-secondary">{editingId ? "Edit MCQ" : "Add MCQ"}</h3>
              {editingId ? (
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>Cancel edit</Button>
              ) : null}
            </div>
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
                  <Label>Option {String.fromCharCode(65 + idx)}</Label>
                  <Input value={opt} onChange={(e) => {
                    const options = [...form.options];
                    options[idx] = e.target.value;
                    setForm({ ...form, options });
                  }} />
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>Correct option</Label>
                <Select value={String(form.correctIndex)} onValueChange={(v) => setForm({ ...form, correctIndex: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {form.options.map((_, idx) => (
                      <SelectItem key={idx} value={String(idx)}>{String.fromCharCode(65 + idx)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Marks</Label><Input type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} /></div>
              <div><Label>Order</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 pb-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active (visible in exam)
                </label>
              </div>
            </div>
            <Button type="submit" disabled={saving} className="bg-sage-primary hover:bg-sage-secondary">
              {saving ? "Saving..." : editingId ? "Update question" : "Add question"}
            </Button>
          </form>

          <div className="rounded-xl border border-sage-border bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sage-border px-4 py-3">
              <p className="text-sm font-semibold text-sage-secondary">
                {questions.length} question(s) · {activeCount} active for students
              </p>
            </div>
            {loading ? <p className="p-4 text-sm text-sage-gray-500">Loading...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q, idx) => (
                    <TableRow key={q._id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {q.image ? (
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-sage-border">
                              <Image src={q.image} alt="" fill className="object-cover" unoptimized />
                            </div>
                          ) : null}
                        <div>
                          <p className="max-w-xl truncate font-medium text-sage-secondary">{q.questionText}</p>
                          {q.isActive === false ? (
                            <Badge variant="outline" className="mt-1 text-amber-700">
                              Inactive — hidden from exam
                            </Badge>
                          ) : null}
                        </div>
                        </div>
                      </TableCell>
                      <TableCell>{q.marks}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(q)}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => removeQuestion(q._id)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-sage-gray-500">Select an online program to manage questions.</p>
      )}
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

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
            <span className="text-sm font-semibold text-sage-secondary">
              {imageFile ? "Choose a different image" : "Upload question image"}
            </span>
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

"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarClock,
  ImageIcon,
  Settings2,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "react-toastify";

import type { AdminExamProgram } from "@/components/admin/exam-hub/ExamHubManager";
import { SubjectSyllabusEditor } from "@/components/admin/exam-hub/SubjectSyllabusEditor";
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
import { cn } from "@/lib/utils";
import {
  normalizeSubjectSyllabus,
  sanitizeSubjectSyllabusItems,
  type SubjectSyllabusItemInput,
} from "@/lib/exam-hub-syllabus";

type Props = {
  initial?: AdminExamProgram | null;
  defaultDeliveryMode?: "online" | "offline";
  formId?: string;
  hideActions?: boolean;
  onSavingChange?: (saving: boolean) => void;
  onSaved: (program: AdminExamProgram) => void;
  onCancel: () => void;
};

type FormState = {
  title: string;
  subtitle: string;
  description: string;
  deliveryMode: "online" | "offline";
  offlineType: "weekly" | "monthly";
  accessType: "public" | "private";
  isPaid: boolean;
  feeAmount: number;
  classLevels: number[];
  startDate: string;
  endDate: string;
  durationMinutes: number;
  totalMarks: number;
  correctMark: number;
  wrongMark: number;
  unansweredMark: number;
  maxAttempts: number;
  instructions: string;
  markingRulesNote: string;
  venue: string;
  scheduleNote: string;
  examTime: string;
  subjectSyllabusItems: SubjectSyllabusItemInput[];
  enrollmentInfo: string;
  shuffleQuestions: boolean;
  showLeaderboard: boolean;
  status: AdminExamProgram["status"];
  featured: boolean;
  order: number;
};

const defaultValues: FormState = {
  title: "",
  subtitle: "",
  description: "",
  deliveryMode: "online",
  offlineType: "weekly",
  accessType: "public",
  isPaid: false,
  feeAmount: 0,
  classLevels: [],
  startDate: "",
  endDate: "",
  durationMinutes: 20,
  totalMarks: 25,
  correctMark: 1,
  wrongMark: 0,
  unansweredMark: 0,
  maxAttempts: 1,
  instructions: "",
  markingRulesNote: "",
  venue: "",
  scheduleNote: "",
  examTime: "",
  subjectSyllabusItems: [{ name: "", syllabus: "" }],
  enrollmentInfo: "",
  shuffleQuestions: true,
  showLeaderboard: true,
  status: "draft",
  featured: false,
  order: 0,
};

const fieldClass = "h-10 rounded-xl border-sage-border bg-white px-3 text-sm shadow-none focus-visible:ring-sage-primary/20";

export function ExamProgramForm({
  initial,
  defaultDeliveryMode,
  formId,
  hideActions = false,
  onSavingChange,
  onSaved,
  onCancel,
}: Props) {
  const fallbackId = useId();
  const resolvedFormId = formId || fallbackId;
  const lockedMode = initial?.deliveryMode || defaultDeliveryMode;
  const isOnlineForm = (lockedMode || "online") === "online";
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState(initial?.image || "");
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          ...defaultValues,
          title: initial.title,
          subtitle: initial.subtitle || "",
          description: initial.description || "",
          deliveryMode: initial.deliveryMode,
          offlineType: (initial.offlineType || "weekly") as "weekly" | "monthly",
          accessType: (initial.accessType || "public") as "public" | "private",
          isPaid: Boolean(initial.isPaid),
          feeAmount: Number(initial.feeAmount || 0),
          classLevels: initial.classLevels || [],
          startDate: initial.startDate?.slice(0, 16) || "",
          endDate: initial.endDate?.slice(0, 16) || "",
          durationMinutes: Number(initial.durationMinutes || 20),
          totalMarks: Number(initial.totalMarks || 25),
          correctMark: Number(initial.correctMark ?? 1),
          wrongMark: Number(initial.wrongMark ?? 0),
          unansweredMark: Number(initial.unansweredMark ?? 0),
          maxAttempts: Number(initial.maxAttempts || 1),
          instructions: initial.instructions || "",
          markingRulesNote: initial.markingRulesNote || "",
          venue: initial.venue || "",
          scheduleNote: initial.scheduleNote || "",
          examTime: initial.examTime || "",
          subjectSyllabusItems: normalizeSubjectSyllabus(initial).map(({ name, syllabus }) => ({
            name,
            syllabus,
          })),
          enrollmentInfo: initial.enrollmentInfo || "",
          shuffleQuestions: Boolean(initial.shuffleQuestions ?? true),
          showLeaderboard: Boolean(initial.showLeaderboard ?? true),
          status: initial.status,
          featured: Boolean(initial.featured),
          order: Number(initial.order || 0),
        }
      : {
          ...defaultValues,
          deliveryMode: defaultDeliveryMode || defaultValues.deliveryMode,
        }
  );

  useEffect(() => {
    onSavingChange?.(loading);
  }, [loading, onSavingChange]);

  function validateForm() {
    const title = form.title.trim();
    if (!title) {
      toast.error("Title is required");
      return false;
    }
    if (title.length > 200) {
      toast.error("Title must be 200 characters or less");
      return false;
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Start and end dates are required");
      return false;
    }
    if (new Date(form.endDate).getTime() <= new Date(form.startDate).getTime()) {
      toast.error("End date must be after start date");
      return false;
    }
    if (form.isPaid && form.feeAmount <= 0) {
      toast.error("Paid exams need a fee greater than 0");
      return false;
    }
    if (isOnlineForm && form.durationMinutes <= 0) {
      toast.error("Duration must be at least 1 minute");
      return false;
    }
    if (isOnlineForm && form.maxAttempts <= 0) {
      toast.error("Max attempts must be at least 1");
      return false;
    }
    if (!isOnlineForm) {
      const syllabusItems = sanitizeSubjectSyllabusItems(form.subjectSyllabusItems);
      if (syllabusItems.length === 0) {
        toast.error("Add at least one subject with a name");
        return false;
      }
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("subtitle", form.subtitle.trim());
      fd.append("description", form.description.trim());
      fd.append("deliveryMode", form.deliveryMode);
      if (form.deliveryMode === "offline") fd.append("offlineType", form.offlineType);
      fd.append("accessType", form.accessType);
      fd.append("isPaid", String(form.isPaid));
      fd.append("feeAmount", String(form.feeAmount));
      fd.append("classLevels", JSON.stringify(form.classLevels));
      fd.append("startDate", form.startDate);
      fd.append("endDate", form.endDate);
      fd.append("durationMinutes", String(form.durationMinutes));
      fd.append("totalMarks", String(form.totalMarks));
      fd.append("correctMark", String(form.correctMark));
      fd.append("wrongMark", String(form.wrongMark));
      fd.append("unansweredMark", String(form.unansweredMark));
      fd.append("maxAttempts", String(form.maxAttempts));
      fd.append("instructions", form.instructions.trim());
      fd.append("markingRulesNote", form.markingRulesNote.trim());
      fd.append("venue", form.venue.trim());
      fd.append("scheduleNote", form.scheduleNote.trim());
      fd.append("examTime", form.examTime.trim());
      const syllabusItems = sanitizeSubjectSyllabusItems(form.subjectSyllabusItems);
      fd.append("subjectSyllabusItems", JSON.stringify(syllabusItems));
      fd.append("enrollmentInfo", form.enrollmentInfo.trim());
      fd.append("shuffleQuestions", String(form.shuffleQuestions));
      fd.append("showLeaderboard", String(form.showLeaderboard));
      fd.append("status", form.status);
      fd.append("featured", String(form.featured));
      fd.append("order", String(form.order));
      if (existingImage && !imageFile) fd.append("image", existingImage);
      if (imageFile) fd.append("imageFile", imageFile);

      const res = await fetch(initial ? `/api/admin/exam-hub/programs/${initial._id}` : "/api/admin/exam-hub/programs", {
        method: initial ? "PATCH" : "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Save failed");
        return;
      }
      onSaved(data.data);
      if (data.data?.image) {
        setExistingImage(data.data.image);
        setImageFile(null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id={resolvedFormId} onSubmit={handleSubmit} className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-start gap-3 rounded-2xl border px-4 py-3.5",
          isOnlineForm
            ? "border-sage-primary/20 bg-gradient-to-r from-sage-red-50/80 to-white"
            : "border-amber-200 bg-gradient-to-r from-amber-50/80 to-white"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-white",
            isOnlineForm ? "bg-sage-primary" : "bg-amber-700"
          )}
        >
          {isOnlineForm ? <Sparkles className="size-4" /> : <CalendarClock className="size-4" />}
        </span>
        <div>
          <p className="text-sm font-bold text-sage-secondary">
            {isOnlineForm ? "Online MCQ exam" : "Offline center exam"}
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-sage-gray-600">
            {isOnlineForm
              ? "Students take MCQs online with optional payment, leaderboard, and attempts."
              : "Information-only program for weekly/monthly center exams. No online questions."}
          </p>
        </div>
      </motion.div>

      <FormSection
        index={0}
        title="Basic details"
        description="Title and short summary shown on the public exam page."
        icon={BookOpen}
      >
        <Field label="Title *" className="sm:col-span-2 lg:col-span-3">
          <Input
            required
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={fieldClass}
            placeholder="e.g. Weekly Model Test – Class 9"
          />
        </Field>
        <Field label="Subtitle">
          <Input
            maxLength={300}
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className={fieldClass}
            placeholder="Optional tagline"
          />
        </Field>
        <Field label="Display order">
          <Input
            type="number"
            min={0}
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
            className={fieldClass}
          />
        </Field>
        <Field label="Description" className="sm:col-span-2 lg:col-span-3">
          <Textarea
            rows={3}
            maxLength={5000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-[88px] rounded-xl border-sage-border bg-white px-3 py-2.5 text-sm"
            placeholder="Brief overview for students..."
          />
        </Field>
      </FormSection>

      <FormSection index={1} title="Cover image" description="Optional hero image for the exam card." icon={ImageIcon}>
        <div className="sm:col-span-2 lg:col-span-3">
          <CoverImageField
            existingImage={existingImage}
            imageFile={imageFile}
            onFileChange={setImageFile}
            onClearExisting={() => setExistingImage("")}
          />
        </div>
      </FormSection>

      <FormSection
        index={2}
        title={isOnlineForm ? "Access & payment" : "Exam details"}
        description={
          isOnlineForm
            ? "Who can enroll and whether bKash payment is required."
            : "Type, timing, and venue for the center exam."
        }
        icon={ShieldCheck}
      >
        {isOnlineForm ? (
          <>
            <Field label="Access">
              <Select value={form.accessType} onValueChange={(v: "public" | "private") => setForm({ ...form, accessType: v })}>
                <SelectTrigger className={cn(fieldClass, "w-full")}>
                  <SelectValue placeholder="Access type" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[120]">
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private (paid)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Fee (BDT)">
              <Input
                type="number"
                min={0}
                value={form.feeAmount}
                disabled={!form.isPaid}
                onChange={(e) => setForm({ ...form, feeAmount: Number(e.target.value) })}
                className={fieldClass}
              />
            </Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <ToggleRow
                checked={form.isPaid}
                onChange={(checked) => setForm({ ...form, isPaid: checked, feeAmount: checked ? form.feeAmount : 0 })}
                label="Requires bKash payment"
                hint="Students must pay before enrollment is approved."
              />
            </div>
          </>
        ) : (
          <>
            <Field label="Offline type">
              <Select value={form.offlineType} onValueChange={(v: "weekly" | "monthly") => setForm({ ...form, offlineType: v })}>
                <SelectTrigger className={cn(fieldClass, "w-full")}>
                  <SelectValue placeholder="Offline type" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[120]">
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Exam time">
              <Input
                maxLength={120}
                value={form.examTime}
                onChange={(e) => setForm({ ...form, examTime: e.target.value })}
                className={fieldClass}
                placeholder="Friday 10:00 AM – 12:30 PM"
              />
            </Field>
            <Field label="Venue" className="sm:col-span-2 lg:col-span-3">
              <Input
                maxLength={300}
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className={fieldClass}
                placeholder="SAGE Academy center, Banasree"
              />
            </Field>
          </>
        )}
      </FormSection>

      <FormSection
        index={3}
        title="Schedule & status"
        description="When the exam is visible and its publishing state."
        icon={CalendarClock}
      >
        <Field label="Start *">
          <Input
            type="datetime-local"
            required
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field label="End *">
          <Input
            type="datetime-local"
            required
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v: AdminExamProgram["status"]) => setForm({ ...form, status: v })}>
            <SelectTrigger className={cn(fieldClass, "w-full")}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[120]">
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Delivery mode">
          <Input
            readOnly
            value={isOnlineForm ? "Online MCQ exam" : "Offline center exam"}
            className={cn(fieldClass, "bg-sage-cream/50 text-sage-gray-600")}
          />
        </Field>
      </FormSection>

      {isOnlineForm ? (
        <FormSection
          index={4}
          title="Exam rules"
          description="Duration, attempts, and marking settings for the MCQ."
          icon={Settings2}
        >
          <Field label="Duration (min)">
            <Input
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              className={fieldClass}
            />
          </Field>
          <Field label="Max attempts">
            <Input
              type="number"
              min={1}
              value={form.maxAttempts}
              onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })}
              className={fieldClass}
            />
          </Field>
          <Field label="Total marks">
            <Input
              type="number"
              min={1}
              value={form.totalMarks}
              onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })}
              className={fieldClass}
            />
          </Field>
          <Field label="Marking rules note" className="sm:col-span-2 lg:col-span-3">
            <Textarea
              rows={3}
              maxLength={2000}
              value={form.markingRulesNote}
              onChange={(e) => setForm({ ...form, markingRulesNote: e.target.value })}
              className="min-h-[80px] rounded-xl border-sage-border bg-white px-3 py-2.5 text-sm"
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <ToggleRow
              checked={form.shuffleQuestions}
              onChange={(checked) => setForm({ ...form, shuffleQuestions: checked })}
              label="Shuffle questions"
              hint="Randomize question order for each attempt."
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <ToggleRow
              checked={form.showLeaderboard}
              onChange={(checked) => setForm({ ...form, showLeaderboard: checked })}
              label="Show leaderboard"
              hint="Display rankings after the exam ends."
            />
          </div>
        </FormSection>
      ) : (
        <FormSection
          index={4}
          title="Public content"
          description="Syllabus and enrollment info shown on the offline exam page."
          icon={BookOpen}
        >
          <div className="sm:col-span-2 lg:col-span-3">
            <SubjectSyllabusEditor
              value={form.subjectSyllabusItems}
              onChange={(subjectSyllabusItems) => setForm({ ...form, subjectSyllabusItems })}
            />
          </div>
          <Field label="Schedule note" className="sm:col-span-2 lg:col-span-3">
            <Textarea
              rows={3}
              maxLength={2000}
              value={form.scheduleNote}
              onChange={(e) => setForm({ ...form, scheduleNote: e.target.value })}
              className="min-h-[80px] rounded-xl border-sage-border bg-white px-3 py-2.5 text-sm"
              placeholder="Reporting time, room number, what to bring..."
            />
          </Field>
          <Field label="Enrollment info" className="sm:col-span-2 lg:col-span-3">
            <Textarea
              rows={3}
              maxLength={2000}
              value={form.enrollmentInfo}
              onChange={(e) => setForm({ ...form, enrollmentInfo: e.target.value })}
              className="min-h-[80px] rounded-xl border-sage-border bg-white px-3 py-2.5 text-sm"
              placeholder="How students enroll at the center, deadline, fee..."
            />
          </Field>
        </FormSection>
      )}

      <FormSection index={5} title="Instructions" description="Guidelines shown to students before the exam." icon={Sparkles}>
        <Field label="Instructions" className="sm:col-span-2 lg:col-span-3">
          <Textarea
            rows={4}
            maxLength={5000}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            className="min-h-[100px] rounded-xl border-sage-border bg-white px-3 py-2.5 text-sm"
            placeholder="Rules, allowed materials, timing notes..."
          />
        </Field>
      </FormSection>

      {!hideActions ? (
        <div className="flex flex-wrap gap-3 border-t border-sage-border/80 pt-4">
          <Button type="submit" disabled={loading} className="rounded-xl bg-sage-primary hover:bg-sage-secondary">
            {loading ? "Saving..." : "Save program"}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function FormSection({
  index,
  title,
  description,
  icon: Icon,
  children,
}: {
  index: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="overflow-hidden rounded-2xl border border-sage-border/70 bg-white shadow-sm"
    >
      <div className="flex items-start gap-3 border-b border-sage-border/60 bg-sage-cream/25 px-4 py-3.5 sm:px-5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-sage-primary ring-1 ring-sage-border/60">
          <Icon className="size-4" />
        </span>
        <div>
          <h4 className="text-sm font-bold text-sage-secondary">{title}</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-sage-gray-500">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5">{children}</div>
    </motion.section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5 sm:col-span-1 lg:col-span-1", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sage-border/70 bg-sage-cream/20 px-4 py-3 transition hover:border-sage-primary/30 hover:bg-sage-red-50/30">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-sage-border text-sage-primary focus:ring-sage-primary/30"
      />
      <span>
        <span className="block text-sm font-semibold text-sage-secondary">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-sage-gray-500">{hint}</span> : null}
      </span>
    </label>
  );
}

function CoverImageField({
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
  const previewLabel = imageFile ? "New upload" : existingImage ? "Current cover" : "Preview";

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

  function clearSelection() {
    onFileChange(null);
    if (!existingImage) onClearExisting();
  }

  function removeAll() {
    onFileChange(null);
    onClearExisting();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
      <div className="space-y-3">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sage-border bg-sage-cream/20 px-4 py-6 text-center transition hover:border-sage-primary/40 hover:bg-sage-red-50/30">
          <Upload className="size-5 text-sage-primary" />
          <span className="text-sm font-semibold text-sage-secondary">
            {imageFile ? "Choose a different image" : "Upload cover image"}
          </span>
          <span className="text-xs text-sage-gray-500">JPG, PNG, WEBP · max 5MB</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
        </label>
        {imageFile ? (
          <p className="truncate text-sm text-sage-gray-600">
            Selected: <span className="font-semibold text-sage-secondary">{imageFile.name}</span>
          </p>
        ) : null}
        {hasPreview ? (
          <div className="flex flex-wrap gap-2">
            {imageFile ? (
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={clearSelection}>
                Clear upload
              </Button>
            ) : null}
            {existingImage ? (
              <Button type="button" variant="destructive" size="sm" className="rounded-lg" onClick={removeAll}>
                Remove cover
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">{previewLabel}</p>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-sage-cream/40 ring-1 ring-sage-border">
          {hasPreview ? (
            <Image src={displaySrc} alt="Exam cover preview" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sage-gray-400">
              <ImageIcon className="size-7" />
              <p className="text-xs font-medium">Preview appears here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

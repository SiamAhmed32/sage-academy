"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Download, Edit3, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

import { classLevelOptions, getClassLabel, toBanglaDigits } from "@/constants/class-levels";
import { downloadRoutineElement, RoutinePaper } from "@/components/assessments/AssessmentRoutineTable";
import { examTypeOptions } from "@/schemas/assessment";
import { AssessmentImageUploadField } from "./AssessmentImageUploadField";

type FeeRow = {
  classLevel: number;
  label: string;
  sageStudentFee: number;
  outsideStudentFee: number;
};

type RoutineRow = {
  day: string;
  time: string;
  subject: string;
};

export type AdminAssessmentItem = {
  _id: string;
  title: string;
  slug: string;
  image?: string;
  examType?: string;
  classLevels: number[];
  version: "bangla" | "english" | "both";
  subjects: string[];
  schoolFocus: string[];
  startDate: string;
  endDate: string;
  routineTitle?: string;
  routineSubtitle?: string;
  scheduleNote: string;
  fees: FeeRow[];
  routine?: RoutineRow[];
  features: string[];
  status: "draft" | "published" | "hidden" | "archived";
  featured: boolean;
  order: number;
};

type Props = {
  type: "modelTest" | "exam";
  items: AdminAssessmentItem[];
};

type AssessmentFormState = {
  title: string;
  image: string;
  examType: string;
  classLevels: number[];
  version: "bangla" | "english" | "both";
  subjects: string;
  schoolFocus: string;
  startDate: string;
  endDate: string;
  routineTitle: string;
  routineSubtitle: string;
  scheduleNote: string;
  fees: FeeRow[];
  routine: RoutineRow[];
  features: string;
  status: "draft" | "published" | "hidden" | "archived";
  featured: boolean;
  order: string;
};

const inputClass = "h-11 rounded-xl border border-sage-border bg-white px-3 text-sm outline-none focus:border-sage-primary";
const textareaClass = "min-h-24 rounded-xl border border-sage-border bg-white px-3 py-3 text-sm outline-none focus:border-sage-primary";
const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const defaultClasses = [6, 7, 8, 9, 10];

function defaultFees(levels = defaultClasses): FeeRow[] {
  return levels.map((level) => ({
    classLevel: level,
    label: getClassLabel(level),
    sageStudentFee: 0,
    outsideStudentFee: 0,
  }));
}

const defaults: AssessmentFormState = {
  title: "",
  image: "",
  examType: "Regular Exam",
  classLevels: defaultClasses,
  version: "both",
  subjects: "Bangla\nEnglish\nMath\nScience",
  schoolFocus: "Banani Ideal\nNational Ideal\nFaizur Rahman Ideal",
  startDate: "",
  endDate: "",
  routineTitle: "SSC 2027",
  routineSubtitle: "Batch: G10-1",
  scheduleNote: "",
  fees: defaultFees(),
  routine: [
    { day: "Saturday", time: "12.00-1.00", subject: "English" },
    { day: "Saturday", time: "1.00-2.00", subject: "Chemistry" },
  ],
  features: "à¦®à¦¾à¦¨à¦¸à¦®à§à¦®à¦¤ à¦ªà§à¦°à¦¶à§à¦¨à¦ªà¦¤à§à¦°\nà¦‰à¦¤à§à¦¤à¦°à¦ªà¦¤à§à¦° à¦¯à¦¾à¦šà¦¾à¦‡à¦•à¦°à¦£\nà¦ªà§à¦°à¦¤à¦¿à¦Ÿà¦¿ à¦ªà¦°à§€à¦•à§à¦·à¦¾à¦° à¦ªà¦° Solve Class\nà¦¨à¦¿à§Ÿà¦®à¦¿à¦¤ à¦®à§‚à¦²à§à¦¯à¦¾à§Ÿà¦¨à§‡ à¦†à¦¤à§à¦®à¦¬à¦¿à¦¶à§à¦¬à¦¾à¦¸ à¦¬à§ƒà¦¦à§à¦§à¦¿",
  status: "draft",
  featured: true,
  order: "0",
};

function dateInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeFees(item: AdminAssessmentItem) {
  if (item.fees?.length) {
    return item.fees.map((fee) => {
      const classLevel = Number(fee.classLevel || 0);
      return {
        classLevel,
        label: fee.label || (classLevel ? getClassLabel(classLevel) : ""),
        sageStudentFee: Number(fee.sageStudentFee || 0),
        outsideStudentFee: Number(fee.outsideStudentFee || 0),
      };
    }).filter((fee) => fee.classLevel);
  }
  return defaultFees(item.classLevels);
}

function itemToForm(item: AdminAssessmentItem): AssessmentFormState {
  return {
    title: item.title,
    image: item.image || "",
    examType: item.examType || "Regular Exam",
    classLevels: item.classLevels.length ? item.classLevels : defaultClasses,
    version: item.version,
    subjects: item.subjects.join("\n"),
    schoolFocus: item.schoolFocus.join("\n"),
    startDate: dateInput(item.startDate),
    endDate: dateInput(item.endDate),
    routineTitle: item.routineTitle || item.title,
    routineSubtitle: item.routineSubtitle || "",
    scheduleNote: item.scheduleNote || "",
    fees: normalizeFees(item),
    routine: item.routine?.length ? item.routine : [],
    features: item.features.join("\n"),
    status: item.status,
    featured: item.featured,
    order: String(item.order || 0),
  };
}

function versionLabel(version: string) {
  if (version === "bangla") return "à¦¬à¦¾à¦‚à¦²à¦¾";
  if (version === "english") return "English";
  return "Bangla + English";
}

function statusTone(status: string) {
  if (status === "published") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "archived") return "bg-slate-100 text-slate-600 ring-slate-200";
  if (status === "hidden") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-sage-red-50 text-sage-primary ring-sage-red-100";
}

function syncFeesForClasses(currentFees: FeeRow[], levels: number[]) {
  return levels.map((level) => {
    const existing = currentFees.find((fee) => Number(fee.classLevel) === level);
    return existing || {
      classLevel: level,
      label: getClassLabel(level),
      sageStudentFee: 0,
      outsideStudentFee: 0,
    };
  });
}

export function AssessmentManager({ type, items }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAssessmentItem | null>(null);
  const [form, setForm] = useState<AssessmentFormState>(defaults);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const isExam = type === "exam";
  const baseUrl = isExam ? "/api/exams" : "/api/model-tests";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.title, item.slug, item.status, item.examType, ...item.subjects, ...item.schoolFocus]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  function updateClassLevels(level: number) {
    setForm((current) => {
      const exists = current.classLevels.includes(level);
      const nextLevels = exists
        ? current.classLevels.filter((item) => item !== level)
        : [...current.classLevels, level].sort((a, b) => a - b);
      return {
        ...current,
        classLevels: nextLevels,
        fees: syncFeesForClasses(current.fees, nextLevels),
      };
    });
  }

  function openCreate() {
    setEditing(null);
    setForm(defaults);
    setImagePreview("");
    setOpen(true);
  }

  function openEdit(item: AdminAssessmentItem) {
    const next = itemToForm(item);
    setEditing(item);
    setForm(next);
    setImagePreview(next.image);
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.classLevels.length === 0) {
      toast.error("à¦•à¦®à¦ªà¦•à§à¦·à§‡ à¦à¦•à¦Ÿà¦¿ à¦¶à§à¦°à§‡à¦£à¦¿ à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¨ à¦•à¦°à§à¦¨");
      return;
    }
    setSaving(true);
    const payload = new FormData(event.currentTarget);
    payload.set("image", form.image);
    payload.set("slug", "");
    payload.set("classLevels", form.classLevels.join(","));
    payload.set("feesJson", JSON.stringify(form.fees));
    payload.set("routineJson", JSON.stringify(form.routine.filter((item) => item.day && item.time && item.subject)));
    if (form.featured) payload.set("featured", "on");
    try {
      const res = await fetch(editing ? `${baseUrl}/${editing._id}` : baseUrl, {
        method: editing ? "PATCH" : "POST",
        body: payload,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "à¦¸à§‡à¦­ à¦•à¦°à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿");
      toast.success(editing ? "à¦†à¦ªà¦¡à§‡à¦Ÿ à¦¹à§Ÿà§‡à¦›à§‡" : "à¦¤à§ˆà¦°à¦¿ à¦¹à§Ÿà§‡à¦›à§‡");
      setOpen(false);
      setEditing(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "à¦¸à§‡à¦­ à¦•à¦°à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿");
    } finally {
      setSaving(false);
    }
  }

  async function archive(item: AdminAssessmentItem) {
    const ok = confirm(`"${item.title}" à¦†à¦°à§à¦•à¦¾à¦‡à¦­ à¦•à¦°à¦¬à§‡à¦¨?`);
    if (!ok) return;
    const archiveForm = itemToForm({ ...item, status: "archived", featured: false });
    const payload = new FormData();
    payload.set("title", archiveForm.title);
    payload.set("image", archiveForm.image);
    payload.set("slug", "");
    payload.set("classLevels", archiveForm.classLevels.join(","));
    payload.set("version", archiveForm.version);
    payload.set("subjects", archiveForm.subjects);
    payload.set("schoolFocus", archiveForm.schoolFocus);
    payload.set("startDate", archiveForm.startDate);
    payload.set("endDate", archiveForm.endDate);
    payload.set("routineTitle", archiveForm.routineTitle);
    payload.set("routineSubtitle", archiveForm.routineSubtitle);
    payload.set("scheduleNote", archiveForm.scheduleNote);
    payload.set("feesJson", JSON.stringify(archiveForm.fees));
    payload.set("routineJson", JSON.stringify(archiveForm.routine));
    payload.set("features", archiveForm.features);
    payload.set("status", "archived");
    payload.set("order", archiveForm.order);
    if (isExam) payload.set("examType", archiveForm.examType);
    try {
      const res = await fetch(`${baseUrl}/${item._id}`, { method: "PATCH", body: payload });
      if (!res.ok) throw new Error();
      toast.success("à¦†à¦°à§à¦•à¦¾à¦‡à¦­ à¦¹à§Ÿà§‡à¦›à§‡");
      router.refresh();
    } catch {
      toast.error("à¦†à¦°à§à¦•à¦¾à¦‡à¦­ à¦•à¦°à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿");
    }
  }

  async function remove(item: AdminAssessmentItem) {
    const ok = confirm(`"${item.title}" à¦šà¦¿à¦°à¦¤à¦°à§‡ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¬à§‡à¦¨?`);
    if (!ok) return;
    try {
      const res = await fetch(`${baseUrl}/${item._id}?permanent=true`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦¹à§Ÿà§‡à¦›à§‡");
      router.refresh();
    } catch {
      toast.error("à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦•à¦°à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-sage-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦®, à¦¸à§à¦•à§à¦², à¦¬à¦¿à¦·à§Ÿ à¦¦à¦¿à§Ÿà§‡ à¦–à§à¦à¦œà§à¦¨..."
            className="h-11 min-w-0 flex-1 rounded-xl border border-sage-border bg-sage-red-50/30 px-4 text-sm outline-none focus:border-sage-primary"
          />
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sage-primary px-5 text-sm font-bold text-white transition hover:bg-sage-secondary"
          >
            <Plus className="h-4 w-4" />
            à¦¨à¦¤à§à¦¨ {isExam ? "Exam" : "Model Test"}
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="rounded-2xl border border-sage-border bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-sage-secondary">{editing ? "à¦à¦¡à¦¿à¦Ÿ à¦•à¦°à§à¦¨" : "à¦¨à¦¤à§à¦¨ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à§à¦¨"}</h3>
              <p className="mt-1 text-sm text-sage-gray-500">Slug auto-generated à¦¹à¦¬à§‡à¥¤ à¦¶à§à¦°à§‡à¦£à¦¿ à¦…à¦¨à§à¦¯à¦¾à§Ÿà§€ à¦«à¦¿ à¦“ à¦°à§à¦Ÿà¦¿à¦¨ à¦¨à¦¿à¦šà§‡ à¦¸à§‡à¦Ÿ à¦•à¦°à§à¦¨à¥¤</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-sage-border">
              <X className="h-4 w-4" />
            </button>
          </div>

          <input type="hidden" name="image" value={form.image} />
          <AssessmentImageUploadField
            previewUrl={imagePreview}
            fallbackUrl={form.image}
            onPreviewChange={(url) => {
              setImagePreview(url);
              if (!url) setForm((current) => ({ ...current, image: "" }));
            }}
          />

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦®
              <input name="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            </label>
            {isExam ? (
              <label className="grid gap-2 text-sm font-bold text-sage-secondary">
                Exam Type
                <select name="examType" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })} className={inputClass}>
                  {examTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦­à¦¾à¦°à§à¦¸à¦¨
              <select name="version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value as AssessmentFormState["version"] })} className={inputClass}>
                <option value="both">Bangla + English</option>
                <option value="bangla">à¦¬à¦¾à¦‚à¦²à¦¾</option>
                <option value="english">English</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸
              <select name="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AssessmentFormState["status"] })} className={inputClass}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦¶à§à¦°à§
              <input name="startDate" required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦¶à§‡à¦·
              <input name="endDate" required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦…à¦°à§à¦¡à¦¾à¦°
              <input name="order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className={inputClass} />
            </label>
            <label className="flex items-center gap-2 self-end rounded-xl border border-sage-border px-4 py-3 text-sm font-bold text-sage-secondary">
              <input type="checkbox" name="featured" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              à¦¹à§‹à¦®à¦ªà§‡à¦œà§‡ à¦«à¦¿à¦šà¦¾à¦°
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-sage-border bg-sage-red-50/20 p-4">
            <p className="text-sm font-black text-sage-secondary">à¦¶à§à¦°à§‡à¦£à¦¿ à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¨</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {classLevelOptions.filter((item) => item.value >= 4 && item.value <= 12).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateClassLevels(option.value)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                    form.classLevels.includes(option.value)
                      ? "bg-sage-primary text-white"
                      : "bg-white text-sage-secondary ring-1 ring-sage-border"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦¬à¦¿à¦·à§Ÿà¦¸à¦®à§‚à¦¹
              <textarea name="subjects" required value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} className={textareaClass} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦Ÿà¦¾à¦°à§à¦—à§‡à¦Ÿ à¦¸à§à¦•à§à¦² / à¦•à¦²à§‡à¦œ
              <textarea name="schoolFocus" value={form.schoolFocus} onChange={(e) => setForm({ ...form, schoolFocus: e.target.value })} className={textareaClass} />
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-sage-border bg-white p-4">
            <p className="text-sm font-black text-sage-secondary">à¦¶à§à¦°à§‡à¦£à¦¿ à¦…à¦¨à§à¦¯à¦¾à§Ÿà§€ à¦«à¦¿</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-sage-primary">
                  <tr>
                    <th className="py-2">à¦¶à§à¦°à§‡à¦£à¦¿</th>
                    <th className="py-2">SAGE à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€</th>
                    <th className="py-2">à¦¬à¦¾à¦‡à¦°à§‡à¦° à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-border">
                  {form.fees.map((fee, index) => (
                    <tr key={fee.classLevel}>
                      <td className="py-3 font-black text-sage-secondary">{getClassLabel(fee.classLevel)}</td>
                      <td className="py-3 pr-3">
                        <input
                          type="number"
                          min="0"
                          value={fee.sageStudentFee}
                          onChange={(e) => {
                            const next = [...form.fees];
                            next[index] = { ...fee, sageStudentFee: Number(e.target.value || 0) };
                            setForm({ ...form, fees: next });
                          }}
                          className={inputClass}
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          min="0"
                          value={fee.outsideStudentFee}
                          onChange={(e) => {
                            const next = [...form.fees];
                            next[index] = { ...fee, outsideStudentFee: Number(e.target.value || 0) };
                            setForm({ ...form, fees: next });
                          }}
                          className={inputClass}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦°à§à¦Ÿà¦¿à¦¨ à¦¹à§‡à¦¡à¦²à¦¾à¦‡à¦¨
              <input
                name="routineTitle"
                value={form.routineTitle}
                onChange={(e) => setForm({ ...form, routineTitle: e.target.value })}
                placeholder="SSC 2027"
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦°à§à¦Ÿà¦¿à¦¨ à¦¸à¦¾à¦¬-à¦¹à§‡à¦¡à¦²à¦¾à¦‡à¦¨
              <input
                name="routineSubtitle"
                value={form.routineSubtitle}
                onChange={(e) => setForm({ ...form, routineSubtitle: e.target.value })}
                placeholder="Batch: G10-1"
                className={inputClass}
              />
            </label>
          </div>

          <RoutineEditor form={form} setForm={setForm} />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦«à¦¿à¦šà¦¾à¦°à¦¸à¦®à§‚à¦¹
              <textarea name="features" required value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className={textareaClass} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              à¦°à§à¦Ÿà¦¿à¦¨ / à¦¸à¦®à§Ÿà¦¸à§‚à¦šà¦¿ à¦¨à§‹à¦Ÿ
              <textarea name="scheduleNote" value={form.scheduleNote} onChange={(e) => setForm({ ...form, scheduleNote: e.target.value })} className={textareaClass} />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <button disabled={saving} className="rounded-xl bg-sage-secondary px-7 py-3 text-sm font-black text-white transition hover:bg-sage-primary disabled:opacity-60">
              {saving ? "à¦¸à§‡à¦­ à¦¹à¦šà§à¦›à§‡..." : editing ? "à¦†à¦ªà¦¡à§‡à¦Ÿ à¦•à¦°à§à¦¨" : "à¦¤à§ˆà¦°à¦¿ à¦•à¦°à§à¦¨"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-sage-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left text-sm">
            <thead className="bg-sage-red-50/70 text-sage-primary">
              <tr>
                <th className="p-4">à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦®</th>
                <th className="p-4">à¦¶à§à¦°à§‡à¦£à¦¿ / à¦­à¦¾à¦°à§à¦¸à¦¨</th>
                <th className="p-4">à¦¬à¦¿à¦·à§Ÿ</th>
                <th className="p-4">à¦¸à§à¦•à§à¦² à¦«à§‹à¦•à¦¾à¦¸</th>
                <th className="p-4">à¦¤à¦¾à¦°à¦¿à¦–</th>
                <th className="p-4">à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-border">
              {filtered.map((item) => (
                <tr key={item._id} className="align-top hover:bg-sage-red-50/20">
                  <td className="p-4">
                    <p className="text-base font-black text-sage-secondary">{item.title}</p>
                    <p className="mt-1 text-xs text-sage-gray-500">{item.slug}</p>
                    {item.image ? <p className="mt-1 text-xs font-bold text-emerald-700">Image added</p> : null}
                    {item.examType ? <p className="mt-1 text-xs font-bold text-sage-primary">{item.examType}</p> : null}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-sage-secondary">à¦•à§à¦²à¦¾à¦¸ {item.classLevels.map(toBanglaDigits).join(", ")}</p>
                    <p className="mt-1 text-xs text-sage-gray-500">{versionLabel(item.version)}</p>
                  </td>
                  <td className="max-w-[220px] p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {item.subjects.slice(0, 5).map((subject) => (
                        <span key={subject} className="rounded-full bg-sage-red-50 px-2 py-1 text-xs font-bold text-sage-secondary ring-1 ring-sage-red-100">{subject}</span>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-[240px] p-4 text-xs font-semibold leading-6 text-sage-gray-700">
                    {item.schoolFocus.length ? item.schoolFocus.join(", ") : "à¦¸à¦¬ à¦¸à§à¦•à§à¦²"}
                  </td>
                  <td className="p-4 text-xs font-bold text-sage-gray-600">
                    {new Date(item.startDate).toLocaleDateString("bn-BD")} - {new Date(item.endDate).toLocaleDateString("bn-BD")}
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusTone(item.status)}`}>{item.status}</span>
                    {item.featured ? <p className="mt-2 text-xs font-bold text-sage-primary">Featured</p> : null}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEdit(item)} className="grid h-9 w-9 place-items-center rounded-lg border border-sage-border text-sage-secondary hover:border-sage-primary hover:text-sage-primary">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => archive(item)} className="grid h-9 w-9 place-items-center rounded-lg bg-sage-red-50 text-sage-primary hover:bg-sage-primary hover:text-white">
                        <Archive className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => remove(item)} className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center font-bold text-sage-gray-500">à¦•à§‹à¦¨à§‹ à¦†à¦‡à¦Ÿà§‡à¦® à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RoutineEditor({
  form,
  setForm,
}: {
  form: AssessmentFormState;
  setForm: (form: AssessmentFormState) => void;
}) {
  const routineRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const cleanRoutine = form.routine.filter((row) => row.day && row.time && row.subject);
  const times = [...new Set(form.routine.map((row) => row.time).filter(Boolean))];
  const usedDays = days.filter((day) => form.routine.some((row) => row.day === day));

  function updateRoutine(index: number, patch: Partial<RoutineRow>) {
    const next = [...form.routine];
    next[index] = { ...next[index], ...patch };
    setForm({ ...form, routine: next });
  }

  async function downloadAdminRoutine() {
    if (!routineRef.current) return;
    setDownloading(true);
    try {
      await downloadRoutineElement(routineRef.current, `${form.title || "class"}-routine.pdf`);
    } catch {
      toast.error("à¦°à§à¦Ÿà¦¿à¦¨ à¦¡à¦¾à¦‰à¦¨à¦²à§‹à¦¡ à¦•à¦°à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-sage-border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-sage-secondary">à¦°à§à¦Ÿà¦¿à¦¨ à¦¤à§ˆà¦°à¦¿</p>
          <p className="mt-1 text-xs font-semibold text-sage-gray-500">à¦¦à¦¿à¦¨, à¦¸à¦®à§Ÿ à¦“ à¦¬à¦¿à¦·à§Ÿ à¦¦à¦¿à¦²à§‡ à¦¨à¦¿à¦šà§‡ à¦°à§à¦Ÿà¦¿à¦¨ à¦Ÿà§‡à¦¬à¦¿à¦² à¦¤à§ˆà¦°à¦¿ à¦¹à¦¬à§‡à¥¤</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...form, routine: [...form.routine, { day: "Saturday", time: "", subject: "" }] })}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sage-primary px-4 text-sm font-black text-white"
        >
          <Plus className="h-4 w-4" />
          à¦°à§à¦Ÿà¦¿à¦¨ à¦¸à¦¾à¦°à¦¿
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {form.routine.map((row, index) => (
          <div key={index} className="grid gap-3 rounded-2xl bg-sage-red-50/30 p-3 md:grid-cols-[180px_1fr_1fr_44px]">
            <select value={row.day} onChange={(e) => updateRoutine(index, { day: e.target.value })} className={inputClass}>
              {days.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
            <input value={row.time} onChange={(e) => updateRoutine(index, { time: e.target.value })} placeholder="12.00-1.00" className={inputClass} />
            <input value={row.subject} onChange={(e) => updateRoutine(index, { subject: e.target.value })} placeholder="English / Math / Chemistry" className={inputClass} />
            <button
              type="button"
              onClick={() => setForm({ ...form, routine: form.routine.filter((_, i) => i !== index) })}
              className="grid h-11 w-11 place-items-center rounded-xl bg-white text-red-600 ring-1 ring-sage-border"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {cleanRoutine.length ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-black bg-white">
          <div className="flex items-center justify-end border-b border-black bg-white p-2">
            <button
              type="button"
              onClick={downloadAdminRoutine}
              disabled={!cleanRoutine.length || downloading}
              title="Download routine"
              className="grid h-9 w-9 place-items-center rounded-md border border-black bg-white text-black disabled:opacity-50"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </button>
          </div>
          <div ref={routineRef}>
            <RoutinePaper
              title={form.routineTitle || form.title || "SSC 2027"}
              subtitle={form.routineSubtitle || "Batch: G10-1"}
              footer={form.scheduleNote}
              routine={cleanRoutine}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

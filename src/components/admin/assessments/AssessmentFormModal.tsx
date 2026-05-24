"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { AdminModal } from "@/components/admin/shared/AdminModal";
import { AssessmentFormTabBasic } from "./AssessmentFormTabBasic";
import { AssessmentFormTabFees } from "./AssessmentFormTabFees";
import { AssessmentFormTabRoutine } from "./AssessmentFormTabRoutine";
import { AssessmentFormTabFeatures } from "./AssessmentFormTabFeatures";
import { getClassLabel } from "@/constants/class-levels";
import type { AdminAssessmentItem } from "./AssessmentManager";

type FeeRow = { classLevel: number; label: string; sageStudentFee: number; outsideStudentFee: number };
type RoutineRow = { day: string; time: string; subject: string };
type ClassInfo = { classLevel: number; subjects: string; routine: RoutineRow[] };

type AssessmentFormState = {
  title: string;
  image: string;
  examType: string;
  classLevels: number[];
  version: "bangla" | "english" | "both";
  schoolFocus: string;
  startDate: string;
  endDate: string;
  routineTitle: string;
  routineSubtitle: string;
  scheduleNote: string;
  fees: FeeRow[];
  classSpecificInfo: ClassInfo[];
  features: string[];
  status: "draft" | "published" | "hidden" | "archived";
  featured: boolean;
  order: string;
};

const defaultClasses = [6, 7, 8, 9, 10];
const defaultFees = (levels = defaultClasses): FeeRow[] =>
  levels.map((level) => ({ classLevel: level, label: getClassLabel(level), sageStudentFee: 0, outsideStudentFee: 0 }));

const defaults: AssessmentFormState = {
  title: "", image: "", examType: "Regular Exam", classLevels: defaultClasses, version: "both",
  schoolFocus: "Banani Ideal\nNational Ideal\nFaizur Rahman Ideal",
  startDate: "", endDate: "", routineTitle: "SSC 2027", routineSubtitle: "Batch: G10-1", scheduleNote: "",
  fees: defaultFees(), classSpecificInfo: defaultClasses.map(c => ({ classLevel: c, subjects: "Bangla\nEnglish\nMath\nScience", routine: [{ day: "Saturday", time: "12.00-1.00", subject: "English" }] })),
  features: ["মানসম্মত প্রশ্নপত্র", "উত্তরপত্র যাচাইকরণ", "প্রতিটি পরীক্ষার পর Solve Class", "নিয়মিত মূল্যায়নে আত্মবিশ্বাস বৃদ্ধি"], status: "draft", featured: true, order: "0",
};

type Props = {
  open: boolean;
  onClose: () => void;
  editingItem: AdminAssessmentItem | null;
  isExam: boolean;
  onSave: (payload: FormData) => Promise<void>;
};

const tabOptions = [
  { id: "basic", label: "বেসিক তথ্য" },
  { id: "fees", label: "শ্রেণি ও ফি" },
  { id: "routine", label: "রুটিন ও বিষয়সূচি" },
  { id: "features", label: "ফিচার ও নোট" },
];

export function AssessmentFormModal({ open, onClose, editingItem, isExam, onSave }: Props) {
  const [form, setForm] = useState<AssessmentFormState>(defaults);
  const [activeTab, setActiveTab] = useState("basic");
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      const start = editingItem.startDate ? new Date(editingItem.startDate).toISOString().slice(0, 10) : "";
      const end = editingItem.endDate ? new Date(editingItem.endDate).toISOString().slice(0, 10) : "";
      setForm({
        title: editingItem.title, image: editingItem.image || "", examType: editingItem.examType || "Regular Exam",
        classLevels: editingItem.classLevels, version: editingItem.version,
        schoolFocus: editingItem.schoolFocus.join("\n"), startDate: start, endDate: end, routineTitle: editingItem.routineTitle || editingItem.title,
        routineSubtitle: editingItem.routineSubtitle || "", scheduleNote: editingItem.scheduleNote || "",
        fees: editingItem.fees?.length ? editingItem.fees.map(f => ({ ...f, classLevel: Number(f.classLevel) })) : defaultFees(editingItem.classLevels),
        classSpecificInfo: editingItem.classSpecificInfo?.length ? editingItem.classSpecificInfo.map(c => ({ ...c, subjects: c.subjects.join("\n") })) : editingItem.classLevels.map(c => ({ classLevel: c, subjects: "Bangla\nEnglish", routine: [] })), features: editingItem.features || [], status: editingItem.status, featured: editingItem.featured, order: String(editingItem.order || 0),
      });
      setImagePreview(editingItem.image || "");
    } else {
      setForm(defaults);
      setImagePreview("");
    }
    setActiveTab("basic");
  }, [editingItem, open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.classLevels.length === 0) return toast.error("কমপক্ষে একটি শ্রেণি নির্বাচন করুন");
    setSaving(true);
    const payload = new FormData();
    payload.set("title", form.title);
    payload.set("image", form.image);
    payload.set("examType", form.examType);
    payload.set("classLevels", form.classLevels.join(","));
    payload.set("version", form.version);
    payload.set("schoolFocus", form.schoolFocus);
    payload.set("startDate", form.startDate);
    payload.set("endDate", form.endDate);
    payload.set("routineTitle", form.routineTitle);
    payload.set("routineSubtitle", form.routineSubtitle);
    payload.set("scheduleNote", form.scheduleNote);
    payload.set("status", form.status);
    payload.set("order", form.order);
    payload.set("features", form.features.join("\n"));
    payload.set("slug", "");
    payload.set("feesJson", JSON.stringify(form.fees));
    payload.set("classSpecificInfoJson", JSON.stringify(form.classSpecificInfo.map(c => ({ ...c, subjects: c.subjects.split("\n").map(s => s.trim()).filter(Boolean) }))));
    if (form.featured) payload.set("featured", "on");

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "সেভ করা যায়নি");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminModal open={open} onClose={onClose} title={editingItem ? "এডিট করুন" : "নতুন তৈরি করুন"} description="শ্রেণি অনুযায়ী ফি ও রুটিন সুন্দরভাবে সাজান।" maxWidth="max-w-5xl">
      <form onSubmit={submit} className="space-y-6">
        <div className="flex border-b border-sage-border overflow-x-auto whitespace-nowrap scrollbar-none pb-px gap-1">
          {tabOptions.map((t) => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={`px-5 py-3 text-sm font-black transition relative ${activeTab === t.id ? "text-sage-primary" : "text-sage-gray-500 hover:text-sage-secondary"}`}>
              {t.label}
              {activeTab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sage-primary rounded-full" />}
            </button>
          ))}
        </div>

        <div className="min-h-[300px]">
          {activeTab === "basic" && <AssessmentFormTabBasic form={form} onChange={(fields) => setForm(f => ({ ...f, ...fields }))} isExam={isExam} imagePreview={imagePreview} onImagePreviewChange={setImagePreview} />}
          {activeTab === "fees" && <AssessmentFormTabFees classLevels={form.classLevels} fees={form.fees} onChange={(levels, feeRows) => {
            // Also ensure classSpecificInfo aligns with classLevels
            setForm(f => {
              const newInfo = levels.map(l => f.classSpecificInfo.find(c => c.classLevel === l) || { classLevel: l, subjects: "Bangla\nEnglish", routine: [] });
              return { ...f, classLevels: levels, fees: feeRows, classSpecificInfo: newInfo };
            });
          }} />}
          {activeTab === "routine" && <AssessmentFormTabRoutine classLevels={form.classLevels} classSpecificInfo={form.classSpecificInfo} onClassSpecificInfoChange={v => setForm(f => ({ ...f, classSpecificInfo: v }))} schoolFocus={form.schoolFocus} onSchoolFocusChange={v => setForm(f => ({ ...f, schoolFocus: v }))} routineTitle={form.routineTitle} onRoutineTitleChange={v => setForm(f => ({ ...f, routineTitle: v }))} routineSubtitle={form.routineSubtitle} onRoutineSubtitleChange={v => setForm(f => ({ ...f, routineSubtitle: v }))} scheduleNote={form.scheduleNote} title={form.title} />}
          {activeTab === "features" && <AssessmentFormTabFeatures features={form.features} onFeaturesChange={v => setForm(f => ({ ...f, features: v }))} scheduleNote={form.scheduleNote} onScheduleNoteChange={v => setForm(f => ({ ...f, scheduleNote: v }))} />}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-sage-border">
          <button type="button" onClick={onClose} className="rounded-xl border border-sage-border px-5 py-3 text-sm font-bold text-sage-secondary transition hover:bg-sage-red-50">বাতিল</button>
          <button disabled={saving} className="rounded-xl bg-sage-secondary px-7 py-3 text-sm font-black text-white transition hover:bg-sage-primary disabled:opacity-60">
            {saving ? "সেভ হচ্ছে..." : editingItem ? "আপডেট করুন" : "তৈরি করুন"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

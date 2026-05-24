"use client";

import { AssessmentImageUploadField } from "./AssessmentImageUploadField";
import { examTypeOptions } from "@/schemas/assessment";

type BasicFormState = {
  title: string;
  image: string;
  examType: string;
  version: "bangla" | "english" | "both";
  status: "draft" | "published" | "hidden" | "archived";
  startDate: string;
  endDate: string;
  order: string;
  featured: boolean;
};

type Props = {
  form: BasicFormState;
  onChange: (fields: Partial<BasicFormState>) => void;
  isExam: boolean;
  imagePreview: string;
  onImagePreviewChange: (url: string) => void;
};

const inputClass = "h-11 rounded-xl border border-sage-border bg-white px-3 text-sm outline-none focus:border-sage-primary";

export function AssessmentFormTabBasic({ form, onChange, isExam, imagePreview, onImagePreviewChange }: Props) {
  return (
    <div className="space-y-4">
      <input type="hidden" name="image" value={form.image} />
      <AssessmentImageUploadField
        previewUrl={imagePreview}
        fallbackUrl={form.image}
        onPreviewChange={(url) => {
          onImagePreviewChange(url);
          if (!url) onChange({ image: "" });
        }}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-2 text-sm font-bold text-sage-secondary">
          শিরোনাম
          <input name="title" required value={form.title} onChange={(e) => onChange({ title: e.target.value })} className={inputClass} />
        </label>

        {isExam && (
          <label className="grid gap-2 text-sm font-bold text-sage-secondary">
            Exam Type
            <select name="examType" value={form.examType} onChange={(e) => onChange({ examType: e.target.value })} className={inputClass}>
              {examTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        )}

        <label className="grid gap-2 text-sm font-bold text-sage-secondary">
          ভার্সন
          <select name="version" value={form.version} onChange={(e) => onChange({ version: e.target.value as any })} className={inputClass}>
            <option value="both">Bangla + English</option>
            <option value="bangla">বাংলা</option>
            <option value="english">English</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-sage-secondary">
          স্ট্যাটাস
          <select name="status" value={form.status} onChange={(e) => onChange({ status: e.target.value as any })} className={inputClass}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-sage-secondary">
          শুরু
          <input name="startDate" required type="date" value={form.startDate} onChange={(e) => onChange({ startDate: e.target.value })} className={inputClass} />
        </label>

        <label className="grid gap-2 text-sm font-bold text-sage-secondary">
          শেষ
          <input name="endDate" required type="date" value={form.endDate} onChange={(e) => onChange({ endDate: e.target.value })} className={inputClass} />
        </label>

        <label className="grid gap-2 text-sm font-bold text-sage-secondary">
          অর্ডার
          <input name="order" type="number" value={form.order} onChange={(e) => onChange({ order: e.target.value })} className={inputClass} />
        </label>

        <label className="flex items-center gap-2 self-end rounded-xl border border-sage-border px-4 py-3.5 text-sm font-bold text-sage-secondary bg-white cursor-pointer select-none">
          <input type="checkbox" name="featured" checked={form.featured} onChange={(e) => onChange({ featured: e.target.checked })} className="rounded text-sage-primary" />
          হোমপেজে ফিচার
        </label>
      </div>
    </div>
  );
}

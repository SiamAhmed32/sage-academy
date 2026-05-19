"use client";

import { User, BookOpen, Award, Quote, Image as ImageIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TeacherFormValues } from "@/components/admin/teachers/types";

interface TeacherFormFieldsProps {
  formData: TeacherFormValues;
  setFormData: React.Dispatch<React.SetStateAction<TeacherFormValues>>;
  previewUrl: string;
  onImageFileChange: (file: File | null) => void;
}

export function TeacherFormFields({
  formData,
  setFormData,
  previewUrl,
  onImageFileChange,
}: TeacherFormFieldsProps) {
  const updateField = <K extends keyof TeacherFormValues>(key: K, value: TeacherFormValues[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-bold text-sage-secondary">নাম *</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-sage-gray-400" />
            <Input
              className="pl-10 h-11 border-sage-border focus:ring-sage-primary"
              placeholder="যেমন: ড. মাহফুজুর রহমান"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-bold text-sage-secondary">বিষয় *</Label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-3 h-4 w-4 text-sage-gray-400" />
            <Input
              className="pl-10 h-11 border-sage-border focus:ring-sage-primary"
              placeholder="যেমন: গণিত / পদার্থবিজ্ঞান"
              value={formData.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-bold text-sage-secondary">পদবী *</Label>
          <div className="relative">
            <Award className="absolute left-3 top-3 h-4 w-4 text-sage-gray-400" />
            <Input
              className="pl-10 h-11 border-sage-border focus:ring-sage-primary"
              placeholder="যেমন: সিনিয়র লেকচারার"
              value={formData.designation}
              onChange={(e) => updateField("designation", e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-bold text-sage-secondary">অভিজ্ঞতা</Label>
          <Input
            className="h-11 border-sage-border focus:ring-sage-primary"
            placeholder="যেমন: ১০ বছরের শিক্ষকতা"
            value={formData.experience}
            onChange={(e) => updateField("experience", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-bold text-sage-secondary">শিক্ষকের ছবি</Label>
        
        <div className="flex flex-col items-start gap-6">
          {/* Preview with Close Button */}
          {previewUrl && (
            <div className="relative h-32 w-32 overflow-hidden rounded-xl border-2 border-sage-primary shadow-lg animate-in fade-in zoom-in duration-300">
              <img
                src={previewUrl}
                alt="Teacher preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  onImageFileChange(null);
                  const input = document.getElementById("teacher-image-input") as HTMLInputElement;
                  if (input) input.value = "";
                }}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600 transition"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Custom Upload Button */}
          <div className="relative">
            <input
              id="teacher-image-input"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
              onChange={(e) => onImageFileChange(e.target.files?.[0] ?? null)}
            />
            <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-sage-border bg-sage-red-50/30 px-6 py-3 transition hover:border-sage-primary hover:bg-sage-red-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sage-primary shadow-sm">
                <ImageIcon size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-sage-secondary">ছবি আপলোড করুন</p>
                <p className="text-[10px] text-sage-gray-500">JPG, PNG, WEBP (Max 5MB)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-bold text-sage-secondary">শিক্ষকের উক্তি (Quote)</Label>
        <div className="relative">
          <Quote className="absolute left-3 top-3 h-4 w-4 text-sage-gray-400" />
          <Textarea
            className="pl-10 min-h-[100px] border-sage-border focus:ring-sage-primary"
            placeholder="শিক্ষকের একটি অনুপ্রেরণামূলক বাণী..."
            value={formData.quote}
            onChange={(e) => updateField("quote", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-8 items-center pt-2">
        <label className="flex items-center gap-3 text-sm font-bold text-sage-secondary cursor-pointer group">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-sage-border text-sage-primary focus:ring-sage-primary cursor-pointer"
            checked={formData.isFeatured}
            onChange={(e) => updateField("isFeatured", e.target.checked)}
          />
          <span className="group-hover:text-sage-primary transition-colors">Featured Teacher</span>
        </label>
        <div className="flex items-center gap-3">
          <Label className="text-sm font-bold text-sage-secondary whitespace-nowrap">সিরিয়াল (Order):</Label>
          <Input
            type="number"
            className="w-24 h-10 border-sage-border focus:ring-sage-primary font-bold text-center"
            value={formData.order}
            onChange={(e) => updateField("order", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
}

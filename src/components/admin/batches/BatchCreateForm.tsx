"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { buildBatchCode, getBatchTitle } from "@/lib/batch-code";
import { BatchImageUploadField } from "./BatchImageUploadField";
import { BatchSubjectRows } from "./BatchSubjectRows";
import type { TeacherOption } from "./types";

const inputClass = "h-11 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none";
const textareaClass = "min-h-24 rounded-lg border border-sage-border bg-sage-white px-3 py-3 text-sm outline-none";
const classes = [4, 5, 6, 7, 8, 9, 10, 11, 12];
const statuses = ["ভর্তি চলছে", "শীঘ্রই শুরু", "ভর্তি বন্ধ"];
const defaultFeatures = ["আলাদা ছেলে-মেয়েদের ব্যাচ", "নিয়মিত একাডেমিক মূল্যায়ন", "অভিজ্ঞ শিক্ষকদের গাইডলাইন", "সাপ্তাহিক পরীক্ষা ও রিপোর্ট"];

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return <span>{children}{required ? <span className="ml-1 text-sage-primary">*</span> : null}</span>;
}

export function BatchCreateForm({ teachers }: { teachers: TeacherOption[] }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [classLevel, setClassLevel] = useState(6);
  const [genderGroup, setGenderGroup] = useState("male");
  const [version, setVersion] = useState("bangla");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const batchCode = useMemo(
    () => buildBatchCode({ classLevel, genderGroup, version }),
    [classLevel, genderGroup, version]
  );

  useEffect(() => () => {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSaving(true);
    const formData = new FormData(form);
    formData.set("isActive", "true");
    formData.set("classLevel", String(classLevel));
    formData.set("genderGroup", genderGroup);
    formData.set("version", version);

    try {
      const response = await fetch("/api/academic-batches", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "ব্যাচ তৈরি করা যায়নি");
      toast.success("একাডেমিক ব্যাচ তৈরি হয়েছে");
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ব্যাচ তৈরি করা যায়নি");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-sage-border bg-sage-white p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-sage-secondary">নতুন একাডেমিক ব্যাচ</h3>
          <p className="mt-1 text-sm text-sage-gray-500">অভ্যন্তরীণ রুটিন এবং সিট ম্যানেজমেন্টের জন্য তথ্য দিন।</p>
        </div>
        <span className="rounded-full bg-sage-red-50 px-4 py-2 text-sm font-bold text-sage-primary">{batchCode}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <FieldLabel required>ব্যাচ কোড</FieldLabel>
          <input value={batchCode} disabled className={`${inputClass} bg-sage-red-50 font-bold text-sage-primary`} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <FieldLabel required>শ্রেণি</FieldLabel>
          <select value={classLevel} onChange={(e) => setClassLevel(Number(e.target.value))} className={inputClass}>
            {classes.map((item) => <option key={item} value={item}>{getBatchTitle(item)}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <FieldLabel required>স্ট্যাটাস</FieldLabel>
          <select name="status" defaultValue="ভর্তি চলছে" className={inputClass}>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <FieldLabel required>ব্যাচ টাইপ</FieldLabel>
          <select value={genderGroup} onChange={(e) => setGenderGroup(e.target.value)} className={inputClass}>
            <option value="male">ছেলেদের ব্যাচ</option>
            <option value="female">মেয়েদের ব্যাচ</option>
            <option value="combined">কম্বাইন্ড ব্যাচ</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <FieldLabel required>ভার্সন</FieldLabel>
          <select value={version} onChange={(e) => setVersion(e.target.value)} className={inputClass}>
            <option value="bangla">বাংলা ভার্সন</option>
            <option value="english">ইংরেজি ভার্সন</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <FieldLabel required>মোট সিট</FieldLabel>
          <input name="totalSeats" type="number" min="0" defaultValue="40" className={inputClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <FieldLabel required>উপলব্ধ সিট</FieldLabel>
          <input name="availableSeats" type="number" min="0" defaultValue="40" className={inputClass} />
        </label>
      </div>

      <label className="mt-5 grid gap-2 text-sm font-semibold text-sage-secondary">
        <FieldLabel>রুটিন নোট (ঐচ্ছিক)</FieldLabel>
        <textarea name="routineNote" placeholder="রুটিন সংক্রান্ত কোনো বিশেষ তথ্য..." className={textareaClass} />
      </label>

      <div className="mt-5">
        <BatchSubjectRows teachers={teachers} />
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button disabled={isSaving} className="h-11 rounded-lg bg-sage-primary px-8 text-sm font-bold text-sage-white disabled:opacity-60">
          {isSaving ? "তৈরি হচ্ছে..." : "একাডেমিক ব্যাচ তৈরি করুন"}
        </button>
      </div>
    </form>
  );
}

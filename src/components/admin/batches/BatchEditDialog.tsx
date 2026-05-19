"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { buildBatchCode, getBatchTitle } from "@/lib/batch-code";
import { BatchSubjectRows } from "./BatchSubjectRows";
import type { AdminBatch, TeacherOption } from "./types";

const inputClass = "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none";
const textareaClass = "min-h-20 rounded-lg border border-sage-border bg-sage-white px-3 py-2 text-sm outline-none";
const classes = [4, 5, 6, 7, 8, 9, 10, 11, 12];
const statuses = ["ভর্তি চলছে", "শীঘ্রই শুরু", "ভর্তি বন্ধ"];

function Label({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return <span>{children}{required ? <span className="ml-1 text-sage-primary">*</span> : null}</span>;
}

export function BatchEditDialog({
  batch,
  teachers,
  onCancel,
}: {
  batch: AdminBatch & { _id: string };
  teachers: TeacherOption[];
  onCancel: () => void;
}) {
  const [classLevel, setClassLevel] = useState(batch.classLevel || 6);
  const [genderGroup, setGenderGroup] = useState(batch.genderGroup || "male");
  const [version, setVersion] = useState(batch.version || "bangla");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const batchCode = useMemo(
    () => buildBatchCode({ classLevel, genderGroup, version }),
    [classLevel, genderGroup, version]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    formData.set("classLevel", String(classLevel));
    formData.set("genderGroup", genderGroup);
    formData.set("version", version);
    formData.set("isActive", "true");

    try {
      const response = await fetch(`/api/batches/${batch._id}`, { method: "PATCH", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "ব্যাচ আপডেট করা যায়নি");
      toast.success("একাডেমিক ব্যাচ আপডেট হয়েছে");
      onCancel();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ব্যাচ আপডেট করা যায়নি");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-sage-border bg-sage-red-50 p-5 shadow-inner">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-sage-secondary">একাডেমিক ব্যাচ এডিট</h3>
          <p className="text-xs text-sage-gray-500">অভ্যন্তরীণ কার্যক্রমের তথ্য পরিবর্তন করুন।</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-lg border border-sage-border bg-white px-4 py-2 text-xs font-bold text-sage-secondary hover:bg-gray-50">বাতিল</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <Label required>ব্যাচ কোড</Label>
          <input value={batchCode} disabled className={`${inputClass} bg-sage-red-100 font-bold text-sage-primary`} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <Label required>শ্রেণি</Label>
          <select value={classLevel} onChange={(e) => setClassLevel(Number(e.target.value))} className={inputClass}>
            {classes.map((item) => <option key={item} value={item}>{getBatchTitle(item)}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <Label required>স্ট্যাটাস</Label>
          <select name="status" defaultValue={batch.status} className={inputClass}>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <Label required>ব্যাচ টাইপ</Label>
          <select value={genderGroup} onChange={(e) => setGenderGroup(e.target.value as any)} className={inputClass}>
            <option value="male">ছেলেদের ব্যাচ</option>
            <option value="female">মেয়েদের ব্যাচ</option>
            <option value="combined">কম্বাইন্ড ব্যাচ</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <Label required>ভার্সন</Label>
          <select value={version} onChange={(e) => setVersion(e.target.value as any)} className={inputClass}>
            <option value="bangla">বাংলা ভার্সন</option>
            <option value="english">ইংরেজি ভার্সন</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <Label required>মোট সিট</Label>
          <input name="totalSeats" type="number" min="0" defaultValue={batch.totalSeats || 40} className={inputClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          <Label required>উপলব্ধ সিট</Label>
          <input name="availableSeats" type="number" min="0" defaultValue={batch.availableSeats || 0} className={inputClass} />
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-semibold text-sage-secondary">
        <Label>রুটিন নোট</Label>
        <textarea name="routineNote" defaultValue={batch.routineNote} className={textareaClass} placeholder="রুটিন সংক্রান্ত তথ্য..." />
      </label>

      <div className="mt-4">
        <BatchSubjectRows teachers={teachers} initialSubjects={batch.subjects} />
      </div>

      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={isSaving} className="rounded-lg bg-sage-primary px-6 py-2.5 text-sm font-bold text-sage-white shadow-md transition hover:bg-sage-primary/90 disabled:opacity-60">
          {isSaving ? "আপডেট হচ্ছে..." : "তথ্য সেভ করুন"}
        </button>
      </div>
    </form>
  );
}

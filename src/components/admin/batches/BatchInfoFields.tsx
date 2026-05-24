"use client";

import { useMemo } from "react";

import { buildBatchCode, getBatchTitle } from "@/lib/batch-code";
import type { AdminBatch } from "./types";

const INPUT_CLASS =
  "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none focus:border-sage-primary";
const TEXTAREA_CLASS =
  "min-h-20 rounded-lg border border-sage-border bg-sage-white px-3 py-2 text-sm outline-none focus:border-sage-primary";
const CLASSES = [4, 5, 6, 7, 8, 9, 10, 11, 12];
const STATUSES = ["ভর্তি চলছে", "শীঘ্রই শুরু", "ভর্তি বন্ধ"];

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="text-sm font-semibold text-sage-secondary">
      {children}
      {required ? <span className="ml-1 text-sage-primary">*</span> : null}
    </span>
  );
}

interface BatchInfoFieldsProps {
  classLevel: number;
  genderGroup: string;
  version: string;
  onClassLevelChange: (v: number) => void;
  onGenderGroupChange: (v: string) => void;
  onVersionChange: (v: string) => void;
  defaults?: Partial<AdminBatch>;
}

export function BatchInfoFields({
  classLevel,
  genderGroup,
  version,
  onClassLevelChange,
  onGenderGroupChange,
  onVersionChange,
  defaults = {},
}: BatchInfoFieldsProps) {
  const batchCode = useMemo(
    () => buildBatchCode({ classLevel, genderGroup, version }),
    [classLevel, genderGroup, version]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Batch Code (auto) */}
        <label className="grid gap-2">
          <Label required>ব্যাচ কোড</Label>
          <input value={batchCode} disabled className={`${INPUT_CLASS} bg-sage-red-50 font-bold text-sage-primary`} />
        </label>

        {/* Class Level */}
        <label className="grid gap-2">
          <Label required>শ্রেণি</Label>
          <select value={classLevel} onChange={(e) => onClassLevelChange(Number(e.target.value))} className={INPUT_CLASS}>
            {CLASSES.map((c) => <option key={c} value={c}>{getBatchTitle(c)}</option>)}
          </select>
        </label>

        {/* Status */}
        <label className="grid gap-2">
          <Label required>স্ট্যাটাস</Label>
          <select name="status" defaultValue={defaults.status || "ভর্তি চলছে"} className={INPUT_CLASS}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        {/* Gender Group */}
        <label className="grid gap-2">
          <Label required>ব্যাচ টাইপ</Label>
          <select value={genderGroup} onChange={(e) => onGenderGroupChange(e.target.value)} className={INPUT_CLASS}>
            <option value="male">ছেলেদের ব্যাচ</option>
            <option value="female">মেয়েদের ব্যাচ</option>
            <option value="combined">কম্বাইন্ড ব্যাচ</option>
          </select>
        </label>

        {/* Version */}
        <label className="grid gap-2">
          <Label required>ভার্সন</Label>
          <select value={version} onChange={(e) => onVersionChange(e.target.value)} className={INPUT_CLASS}>
            <option value="bangla">বাংলা ভার্সন</option>
            <option value="english">ইংরেজি ভার্সন</option>
          </select>
        </label>

        {/* Total Seats */}
        <label className="grid gap-2">
          <Label required>মোট সিট</Label>
          <input name="totalSeats" type="number" min="0" defaultValue={defaults.totalSeats ?? 40} className={INPUT_CLASS} />
        </label>

        {/* Available Seats */}
        <label className="grid gap-2">
          <Label required>উপলব্ধ সিট</Label>
          <input name="availableSeats" type="number" min="0" defaultValue={defaults.availableSeats ?? 40} className={INPUT_CLASS} />
        </label>
      </div>

      {/* Routine Note */}
      <label className="grid gap-2">
        <Label>রুটিন নোট (ঐচ্ছিক)</Label>
        <textarea name="routineNote" defaultValue={defaults.routineNote ?? ""} placeholder="রুটিন সংক্রান্ত তথ্য..." className={TEXTAREA_CLASS} />
      </label>
    </div>
  );
}

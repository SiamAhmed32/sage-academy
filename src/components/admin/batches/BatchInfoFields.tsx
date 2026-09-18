"use client";

import { useMemo } from "react";

import {
  adminClassLevelOptions,
  adminGenderLabels,
  adminVersionLabels,
} from "@/constants/admin-display";
import { buildBatchCode } from "@/lib/batch-code";
import type { AdminBatch } from "./types";

const INPUT_CLASS =
  "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none focus:border-sage-primary";
const TEXTAREA_CLASS =
  "min-h-20 rounded-lg border border-sage-border bg-sage-white px-3 py-2 text-sm outline-none focus:border-sage-primary";
const CLASSES = adminClassLevelOptions.filter((option) => option.value >= 4);
const STATUSES = [
  { value: "ভর্তি চলছে", label: "Admission open" }, // admin-language-allow: persisted enum value
  { value: "শীঘ্রই শুরু", label: "Starting soon" }, // admin-language-allow: persisted enum value
  { value: "ভর্তি বন্ধ", label: "Admission closed" }, // admin-language-allow: persisted enum value
];

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
          <Label required>Batch code</Label>
          <input value={batchCode} disabled className={`${INPUT_CLASS} bg-sage-red-50 font-bold text-sage-primary`} />
        </label>

        {/* Class Level */}
        <label className="grid gap-2">
          <Label required>Class</Label>
          <select value={classLevel} onChange={(e) => onClassLevelChange(Number(e.target.value))} className={INPUT_CLASS}>
            {CLASSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        {/* Status */}
        <label className="grid gap-2">
          <Label required>Status</Label>
          <select
            name="status"
            defaultValue={defaults.status || "ভর্তি চলছে" /* admin-language-allow: persisted enum fallback */}
            className={INPUT_CLASS}
          >
            {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>

        {/* Gender Group */}
        <label className="grid gap-2">
          <Label required>Batch type</Label>
          <select value={genderGroup} onChange={(e) => onGenderGroupChange(e.target.value)} className={INPUT_CLASS}>
            <option value="male">{adminGenderLabels.male}</option>
            <option value="female">{adminGenderLabels.female}</option>
            <option value="combined">{adminGenderLabels.combined}</option>
          </select>
        </label>

        {/* Version */}
        <label className="grid gap-2">
          <Label required>Version</Label>
          <select value={version} onChange={(e) => onVersionChange(e.target.value)} className={INPUT_CLASS}>
            <option value="bangla">{adminVersionLabels.bangla}</option>
            <option value="english">{adminVersionLabels.english}</option>
          </select>
        </label>

        {/* Total Seats */}
        <label className="grid gap-2">
          <Label required>Total seats</Label>
          <input name="totalSeats" type="number" min="0" defaultValue={defaults.totalSeats ?? 40} className={INPUT_CLASS} />
        </label>

        {/* Available Seats */}
        <label className="grid gap-2">
          <Label required>Available seats</Label>
          <input name="availableSeats" type="number" min="0" defaultValue={defaults.availableSeats ?? 40} className={INPUT_CLASS} />
        </label>
      </div>

      {/* Routine Note */}
      <label className="grid gap-2">
        <Label>Schedule note (optional)</Label>
        <textarea name="routineNote" defaultValue={defaults.routineNote ?? ""} placeholder="Enter schedule information..." className={TEXTAREA_CLASS} />
      </label>
    </div>
  );
}

"use client";

import { Plus, Search } from "lucide-react";
import { classLevelOptions } from "@/constants/class-levels";

type Props = {
  query: string;
  onQueryChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  classFilter: string;
  onClassFilterChange: (val: string) => void;
  onCreateClick: () => void;
  isExam: boolean;
};

const selectClass = "h-11 rounded-xl border border-sage-border bg-white px-3 text-sm outline-none focus:border-sage-primary cursor-pointer";

export function AssessmentFilters({
  query, onQueryChange,
  statusFilter, onStatusFilterChange,
  classFilter, onClassFilterChange,
  onCreateClick, isExam,
}: Props) {
  return (
    <div className="rounded-2xl border border-sage-border bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-12 items-center">
        <div className="relative md:col-span-5">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sage-gray-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="শিরোনাম, স্কুল বা বিষয় দিয়ে খুঁজুন..."
            className="h-11 w-full rounded-xl border border-sage-border bg-sage-red-50/20 pl-11 pr-4 text-sm outline-none focus:border-sage-primary"
          />
        </div>

        <div className="md:col-span-3">
          <select value={classFilter} onChange={(e) => onClassFilterChange(e.target.value)} className={`${selectClass} w-full`}>
            <option value="all">সব শ্রেণি</option>
            {classLevelOptions.filter(o => o.value >= 4 && o.value <= 12).map((option) => (
              <option key={option.value} value={String(option.value)}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} className={`${selectClass} w-full`}>
            <option value="all">সব স্ট্যাটাস</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <button
            type="button"
            onClick={onCreateClick}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sage-primary px-4 text-sm font-bold text-white transition hover:bg-sage-secondary shadow-sm"
          >
            <Plus className="h-4 w-4" />
            নতুন {isExam ? "Exam" : "Model Test"}
          </button>
        </div>
      </div>
    </div>
  );
}

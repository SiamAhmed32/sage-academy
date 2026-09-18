"use client";

import { Filter, Plus, Search } from "lucide-react";
import { adminClassLevelOptions } from "@/constants/admin-display";

type Props = {
  filters: {
    q: string;
    status: string;
    classLevel: string;
    sort: string;
  };
  onCreateClick: () => void;
  isExam: boolean;
};

const selectClass = "h-11 rounded-xl border border-sage-border bg-white px-3 text-sm outline-none focus:border-sage-primary cursor-pointer";

export function AssessmentFilters({
  filters,
  onCreateClick,
  isExam,
}: Props) {
  return (
    <div className="rounded-2xl border border-sage-border bg-white p-4 shadow-sm">
      <form method="get" className="grid items-center gap-3 md:grid-cols-12">
        <div className="relative md:col-span-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sage-gray-400" />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search by title, school, or subject..."
            className="h-11 w-full rounded-xl border border-sage-border bg-sage-red-50/20 pl-11 pr-4 text-sm outline-none focus:border-sage-primary"
          />
        </div>

        <div className="md:col-span-2">
          <select name="classLevel" defaultValue={filters.classLevel} className={`${selectClass} w-full`}>
            <option value="">All classes</option>
            {adminClassLevelOptions.filter(o => o.value >= 4 && o.value <= 12).map((option) => (
              <option key={option.value} value={String(option.value)}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select name="status" defaultValue={filters.status} className={`${selectClass} w-full`}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <select name="sort" defaultValue={filters.sort} className={`${selectClass} w-full`}>
            <option value="order">Display order</option>
            <option value="newest">Newest first</option>
            <option value="title">Title A–Z</option>
            <option value="startDate">Start date</option>
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-sage-primary px-4 text-sm font-bold text-sage-primary transition hover:bg-sage-red-50 md:col-span-2"
        >
          <Filter className="h-4 w-4" />
          Apply
        </button>
      </form>

      <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onCreateClick}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sage-primary px-5 text-sm font-bold text-white shadow-sm transition hover:bg-sage-secondary"
          >
            <Plus className="h-4 w-4" />
            New {isExam ? "Exam" : "Model Test"}
          </button>
      </div>
    </div>
  );
}

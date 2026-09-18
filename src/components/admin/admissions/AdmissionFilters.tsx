"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, Calendar, Filter, RotateCcw, Search } from "lucide-react";
import { requestStatusOptions } from "@/constants/admin";

type Props = {
  search: string;
  status: string;
  className: string;
  view: string;
  sort: string;
  dateRange: string;
  limit: number;
  pageSizeOptions: number[];
};

export function AdmissionFilters({
  search,
  status,
  className,
  view,
  sort,
  dateRange,
  limit,
  pageSizeOptions,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search);

  const updateFilters = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchValue.trim() !== search) updateFilters({ search: searchValue.trim() });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [search, searchValue, updateFilters]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          aria-label="Search admission applications"
          placeholder="Search by student, guardian, phone, email, or school..."
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-sage-primary focus:bg-white"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="text-gray-400" size={18} />
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
        >
          <option value="all">All statuses</option>
          {requestStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          aria-label="Filter by class"
          value={className}
          onChange={(e) => updateFilters({ class: e.target.value })}
          className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
        >
          <option value="all">All classes</option>
          {["5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
            <option key={c} value={c}>Class {c}</option>
          ))}
        </select>

        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => updateFilters({ view: "active" })}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${view === "active" ? "bg-white text-sage-primary shadow-sm" : "text-gray-500"}`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => updateFilters({ view: "archived" })}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${view === "archived" ? "bg-white text-sage-primary shadow-sm" : "text-gray-500"}`}
          >
            Archived
          </button>
        </div>

        <Calendar className="text-gray-400" size={18} />
        <select
          aria-label="Filter by date"
          value={dateRange}
          onChange={(e) => updateFilters({ dateRange: e.target.value })}
          className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
        >
          <option value="all">All dates</option>
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
        </select>

        <ArrowUpDown className="text-gray-400" size={18} />
        <select
          aria-label="Sort applications"
          value={sort}
          onChange={(e) => updateFilters({ sort: e.target.value })}
          className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>

        <select
          aria-label="Applications per page"
          value={String(limit)}
          onChange={(e) => updateFilters({ limit: e.target.value })}
          className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => router.push("/admin/admissions")}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition hover:bg-gray-50 hover:text-sage-primary"
          title="Clear filters"
          aria-label="Clear filters"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}

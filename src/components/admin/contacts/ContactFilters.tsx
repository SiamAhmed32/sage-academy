"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Calendar, ArrowUpDown } from "lucide-react";
import { contactStatusOptions } from "@/constants/admin";

type ContactFiltersProps = {
  q: string;
  status: string;
  sort: string;
  dateRange: string;
};

export function ContactFilters({ q, status, sort, dateRange }: ContactFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(q);

  const updateParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchValue.trim() !== q) updateParams("q", searchValue.trim());
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [q, searchValue, updateParams]);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-3 h-4 w-4 text-sage-gray-400" />
        <input
          className="h-10 w-full rounded-lg border border-sage-border bg-white pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-sage-primary"
          placeholder="Search by name or phone number..."
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sage-gray-500" />
          <select
            className="h-10 rounded-lg border border-sage-border bg-white px-3 text-sm outline-none"
            defaultValue={dateRange}
            onChange={(e) => updateParams("dateRange", e.target.value)}
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-sage-gray-500" />
          <select
            className="h-10 rounded-lg border border-sage-border bg-white px-3 text-sm outline-none"
            defaultValue={status}
            onChange={(e) => updateParams("status", e.target.value)}
          >
            <option value="all">All statuses</option>
            {contactStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-sage-gray-500" />
          <select
            className="h-10 rounded-lg border border-sage-border bg-white px-3 text-sm outline-none"
            defaultValue={sort}
            onChange={(e) => updateParams("sort", e.target.value)}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Calendar, ArrowUpDown } from "lucide-react";
import { contactStatusOptions } from "@/constants/admin";

type ContactFiltersProps = {
  q: string;
  status: string;
  sort: string;
};

export function ContactFilters({ q, status, sort }: ContactFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateRange = searchParams.get("dateRange") || "all";

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-3 h-4 w-4 text-sage-gray-400" />
        <input
          className="h-10 w-full rounded-lg border border-sage-border bg-white pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-sage-primary"
          placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
          defaultValue={q}
          onChange={(e) => {
            const val = e.target.value;
            const timeout = setTimeout(() => updateParams("q", val), 500);
            return () => clearTimeout(timeout);
          }}
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
            <option value="all">সব সময়</option>
            <option value="today">আজকের</option>
            <option value="week">এই সপ্তাহের</option>
            <option value="month">এই মাসের</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-sage-gray-500" />
          <select
            className="h-10 rounded-lg border border-sage-border bg-white px-3 text-sm outline-none"
            defaultValue={status}
            onChange={(e) => updateParams("status", e.target.value)}
          >
            <option value="all">সব স্ট্যাটাস</option>
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
            <option value="desc">নতুন আগে</option>
            <option value="asc">পুরানো আগে</option>
          </select>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

import { classLevelOptions } from "@/constants/class-levels";
import type { NoticeBatchOption } from "./NoticeCreateForm";

type NoticeFiltersProps = {
  q: string;
  type: string;
  classLevel: string;
  batch: string;
  status: string;
  batches: NoticeBatchOption[];
};

type FilterState = Omit<NoticeFiltersProps, "batches">;

const inputClass =
  "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none focus:border-sage-primary";

function buildNoticeQuery(filters: FilterState) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.type.trim()) params.set("type", filters.type.trim());
  if (filters.classLevel.trim()) params.set("classLevel", filters.classLevel.trim());
  if (filters.batch.trim()) params.set("batch", filters.batch.trim());
  if (filters.status.trim()) params.set("status", filters.status.trim());
  return params.toString();
}

export function NoticeFilters({ q, type, classLevel, batch, status, batches }: NoticeFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchTimerRef = useRef<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({ q, type, classLevel, batch, status });

  const filteredBatches = filters.classLevel
    ? batches.filter((item) => String(item.classLevel) === filters.classLevel)
    : batches;

  const applyFilters = useCallback(
    (nextFilters: FilterState) => {
      const query = buildNoticeQuery(nextFilters);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    };
  }, []);

  function scheduleSearch(nextFilters: FilterState) {
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => applyFilters(nextFilters), 300);
  }

  function updateFilter(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    const nextFilters = {
      ...filters,
      [name]: value,
      ...(name === "classLevel" ? { batch: "" } : {}),
    };
    setFilters(nextFilters);

    if (name === "q") {
      scheduleSearch(nextFilters);
      return;
    }

    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    applyFilters(nextFilters);
  }

  return (
    <div className="mb-5 grid gap-3 rounded-xl border border-sage-border bg-sage-white p-4 lg:grid-cols-12">
      <input
        name="q"
        value={filters.q}
        onChange={updateFilter}
        placeholder="শিরোনাম, টপিক বা বিস্তারিত দিয়ে খুঁজুন"
        className={`${inputClass} lg:col-span-3`}
      />
      <select name="type" value={filters.type} onChange={updateFilter} className={`${inputClass} lg:col-span-2`}>
        <option value="">সব ধরন</option>
        <option value="general">সাধারণ</option>
        <option value="exam">পরীক্ষা</option>
        <option value="payment">পেমেন্ট</option>
      </select>
      <select
        name="classLevel"
        value={filters.classLevel}
        onChange={updateFilter}
        className={`${inputClass} lg:col-span-2`}
      >
        <option value="">সব শ্রেণি</option>
        {classLevelOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select name="batch" value={filters.batch} onChange={updateFilter} className={`${inputClass} lg:col-span-2`}>
        <option value="">সব ব্যাচ</option>
        {filteredBatches.map((item) => (
          <option key={item._id} value={item._id}>
            {item.batchCode || item.title}
          </option>
        ))}
      </select>
      <select name="status" value={filters.status} onChange={updateFilter} className={`${inputClass} lg:col-span-2`}>
        <option value="">সব স্ট্যাটাস</option>
        <option value="published">প্রকাশিত</option>
        <option value="draft">ড্রাফট</option>
      </select>
      <Link
        href="/admin/notices"
        className="flex h-10 items-center justify-center rounded-lg border border-sage-border px-4 text-sm font-bold text-sage-secondary lg:col-span-1"
      >
        Reset
      </Link>
    </div>
  );
}

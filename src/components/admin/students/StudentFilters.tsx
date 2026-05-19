"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { classLevelOptions } from "@/constants/class-levels";

type StudentFiltersProps = {
  q: string;
  classLevel: string;
  batchCode: string;
  status: string;
  batches: { _id: string; title: string; batchCode: string }[];
};

const inputClass = "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none";
const classLevels = classLevelOptions;


export function StudentFilters({
  q,
  classLevel,
  batchCode,
  status,
  batches,
}: StudentFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchTimerRef = useRef<number | null>(null);
  const [filters, setFilters] = useState({
    q,
    classLevel,
    batchCode: batchCode || "all",
    status: status || "active",
  });

  const applyFilters = useCallback(
    (nextFilters: typeof filters) => {
      const params = new URLSearchParams();
      if (nextFilters.q.trim()) params.set("q", nextFilters.q.trim());
      if (nextFilters.classLevel.trim()) params.set("classLevel", nextFilters.classLevel.trim());
      if (nextFilters.batchCode && nextFilters.batchCode !== "all") {
        params.set("batchCode", nextFilters.batchCode);
      }
      if (nextFilters.status && nextFilters.status !== "active") {
        params.set("status", nextFilters.status);
      }
      
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    };
  }, []);

  function scheduleSearch(nextFilters: typeof filters) {
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      applyFilters(nextFilters);
    }, 300);
  }

  function updateFilter(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    const nextFilters = { ...filters, [name]: value };
    setFilters(nextFilters);

    if (name === "q") {
      scheduleSearch(nextFilters);
      return;
    }

    applyFilters(nextFilters);
  }

  return (
    <div className="mb-5 grid gap-3 rounded-xl border border-sage-border bg-sage-white p-4 lg:grid-cols-12">
      <input
        name="q"
        value={filters.q}
        onChange={updateFilter}
        placeholder="নাম, হোয়াটসঅ্যাপ বা স্টুডেন্ট আইডি দিয়ে খুঁজুন"
        className={`${inputClass} lg:col-span-4`}
      />
      <select
        name="classLevel"
        value={filters.classLevel}
        onChange={updateFilter}
        className={`${inputClass} lg:col-span-2`}
      >
        <option value="">সব শ্রেণি</option>
        {classLevels.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
      <select
        name="batchCode"
        value={filters.batchCode}
        onChange={updateFilter}
        className={`${inputClass} lg:col-span-2`}
      >
        <option value="all">সব ব্যাচ</option>
        {batches.map((batch) => (
          <option key={batch._id} value={batch.batchCode}>
            {batch.title} {batch.batchCode ? `(${batch.batchCode})` : ""}
          </option>
        ))}
      </select>
      <select
        name="status"
        value={filters.status}
        onChange={updateFilter}
        className={`${inputClass} lg:col-span-2`}
      >
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
      <Link
        href="/admin/students"
        className="flex h-10 items-center justify-center rounded-lg border border-sage-border px-4 text-sm font-bold text-sage-secondary lg:col-span-2"
      >
        Reset
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { adminClassLevelOptions } from "@/constants/admin-display";

type StudentFiltersProps = {
  q: string;
  classLevel: string;
  batchCode: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  sort: string;
  limit: number;
  batches: { _id: string; title: string; batchCode: string }[];
};

const inputClass = "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none";
const classLevels = adminClassLevelOptions;


export function StudentFilters({
  q,
  classLevel,
  batchCode,
  status,
  dateFrom,
  dateTo,
  sort,
  limit,
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
    dateFrom,
    dateTo,
    sort: sort || "created-desc",
    limit: String(limit),
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
      if (nextFilters.dateFrom) params.set("dateFrom", nextFilters.dateFrom);
      if (nextFilters.dateTo) params.set("dateTo", nextFilters.dateTo);
      if (nextFilters.sort !== "created-desc") params.set("sort", nextFilters.sort);
      params.set("limit", nextFilters.limit);
      
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
    <div className="mb-5 grid gap-3 rounded-xl border border-sage-border bg-sage-white p-4 md:grid-cols-2 xl:grid-cols-12">
      <input
        name="q"
        value={filters.q}
        onChange={updateFilter}
        placeholder="Search by name, WhatsApp, or student ID"
        aria-label="Search students"
        className={`${inputClass} xl:col-span-4`}
      />
      <select
        name="classLevel"
        value={filters.classLevel}
        onChange={updateFilter}
        aria-label="Filter by class"
        className={`${inputClass} xl:col-span-2`}
      >
        <option value="">All Classes</option>
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
        aria-label="Filter by batch"
        className={`${inputClass} xl:col-span-2`}
      >
        <option value="all">All Batches</option>
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
        aria-label="Filter by status"
        className={`${inputClass} xl:col-span-2`}
      >
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
      <input
        type="date"
        name="dateFrom"
        value={filters.dateFrom}
        onChange={updateFilter}
        aria-label="Admission date from"
        className={`${inputClass} xl:col-span-2`}
      />
      <input
        type="date"
        name="dateTo"
        value={filters.dateTo}
        onChange={updateFilter}
        aria-label="Admission date to"
        className={`${inputClass} xl:col-span-2`}
      />
      <select
        name="sort"
        value={filters.sort}
        onChange={updateFilter}
        aria-label="Sort students"
        className={`${inputClass} xl:col-span-2`}
      >
        <option value="created-desc">Newest Records</option>
        <option value="admission-desc">Latest Admission</option>
        <option value="name-asc">Name A-Z</option>
        <option value="id-asc">Student ID</option>
      </select>
      <select
        name="limit"
        value={filters.limit}
        onChange={updateFilter}
        aria-label="Rows per page"
        className={`${inputClass} xl:col-span-2`}
      >
        <option value="10">10 per page</option>
        <option value="25">25 per page</option>
        <option value="50">50 per page</option>
      </select>
      <Link
        href="/admin/students"
        className="flex h-10 items-center justify-center rounded-lg border border-sage-border px-4 text-sm font-bold text-sage-secondary xl:col-span-2"
      >
        Reset
      </Link>
    </div>
  );
}

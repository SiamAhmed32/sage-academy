"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

type BatchFiltersProps = {
  q: string;
  classLevel: string;
  genderGroup: string;
  status: string;
};

type FilterState = BatchFiltersProps;

const inputClass = "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none";
const classLevels = [
  { value: "5", label: "৫ম শ্রেণি" },
  { value: "6", label: "৬ষ্ঠ শ্রেণি" },
  { value: "7", label: "৭ম শ্রেণি" },
  { value: "8", label: "৮ম শ্রেণি" },
  { value: "9", label: "৯ম শ্রেণি" },
  { value: "10", label: "১০ম শ্রেণি" },
  { value: "11", label: "একাদশ শ্রেণি" },
  { value: "12", label: "দ্বাদশ শ্রেণি" },
];

function buildBatchQuery(filters: FilterState) {
  const params = new URLSearchParams();

  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.classLevel.trim()) params.set("classLevel", filters.classLevel.trim());
  if (filters.genderGroup && filters.genderGroup !== "all") {
    params.set("genderGroup", filters.genderGroup);
  }
  if (filters.status && filters.status !== "all") params.set("status", filters.status);

  return params.toString();
}

export function BatchFilters({
  q,
  classLevel,
  genderGroup,
  status,
}: BatchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchTimerRef = useRef<number | null>(null);
  const [filters, setFilters] = useState({
    q,
    classLevel,
    genderGroup: genderGroup || "all",
    status: status || "all",
  });

  const applyFilters = useCallback(
    (nextFilters: FilterState) => {
      const query = buildBatchQuery(nextFilters);
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

    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    applyFilters(nextFilters);
  }

  return (
    <div className="mb-5 grid gap-3 rounded-xl border border-sage-border bg-sage-white p-4 lg:grid-cols-12">
      <input
        name="q"
        value={filters.q}
        onChange={updateFilter}
        placeholder="ব্যাচ কোড, শ্রেণি বা slug দিয়ে খুঁজুন"
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
        name="genderGroup"
        value={filters.genderGroup}
        onChange={updateFilter}
        className={`${inputClass} lg:col-span-2`}
      >
        <option value="all">সব ধরন</option>
        <option value="male">ছেলেদের ব্যাচ</option>
        <option value="female">মেয়েদের ব্যাচ</option>
      </select>
      <select
        name="status"
        value={filters.status}
        onChange={updateFilter}
        className={`${inputClass} lg:col-span-2`}
      >
        <option value="all">সব স্ট্যাটাস</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="archived">Archived</option>
      </select>
      <Link
        href="/admin/batches"
        className="flex h-10 items-center justify-center rounded-lg border border-sage-border px-4 text-sm font-bold text-sage-secondary lg:col-span-2"
      >
        Reset
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";

import { adminClassLevelOptions } from "@/constants/admin-display";

type BatchFiltersProps = {
  q: string;
  classLevel: string;
  genderGroup: string;
  status: string;
  sort: string;
};

const inputClass = "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none";
const classLevels = adminClassLevelOptions.filter((option) => option.value >= 5);

export function BatchFilters({ q, classLevel, genderGroup, status, sort }: BatchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchTimerRef = useRef<number | null>(null);
  const [filters, setFilters] = useState({
    q,
    classLevel,
    genderGroup: genderGroup || "all",
    status: status || "all",
    sort: sort || "default",
  });

  const applyFilters = (next: typeof filters) => {
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.classLevel.trim()) params.set("classLevel", next.classLevel.trim());
    if (next.genderGroup !== "all") params.set("genderGroup", next.genderGroup);
    if (next.status !== "all") params.set("status", next.status);
    if (next.sort !== "default") params.set("sort", next.sort);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  useEffect(() => {
    return () => { if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current); };
  }, []);

  function updateFilter(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    const nextFilters = { ...filters, [name]: value };
    setFilters(nextFilters);

    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    if (name === "q") {
      searchTimerRef.current = window.setTimeout(() => applyFilters(nextFilters), 300);
    } else {
      applyFilters(nextFilters);
    }
  }

  return (
    <div className="mb-5 grid gap-3 rounded-xl border border-sage-border bg-sage-white p-4 lg:grid-cols-12">
      <input
        name="q"
        value={filters.q}
        onChange={updateFilter}
        maxLength={80}
        placeholder="Search by batch title, code, or slug"
        className={`${inputClass} lg:col-span-3`}
      />
      <select name="classLevel" value={filters.classLevel} onChange={updateFilter} className={`${inputClass} lg:col-span-2`}>
        <option value="">All classes</option>
        {classLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
      </select>
      <select name="genderGroup" value={filters.genderGroup} onChange={updateFilter} className={`${inputClass} lg:col-span-2`}>
        <option value="all">All types</option>
        <option value="male">Boys</option>
        <option value="female">Girls</option>
        <option value="combined">Combined</option>
      </select>
      <select name="status" value={filters.status} onChange={updateFilter} className={`${inputClass} lg:col-span-1`}>
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="archived">Archived</option>
      </select>
      <select name="sort" value={filters.sort} onChange={updateFilter} className={`${inputClass} lg:col-span-2`}>
        <option value="default">Default order</option>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="class_asc">Class, low to high</option>
        <option value="title_asc">Title, A–Z</option>
        <option value="title_desc">Title, Z–A</option>
      </select>
      <Link
        href={pathname}
        className="flex h-10 items-center justify-center rounded-lg border border-sage-border px-4 text-sm font-bold text-sage-secondary lg:col-span-2"
      >
        Reset
      </Link>
    </div>
  );
}

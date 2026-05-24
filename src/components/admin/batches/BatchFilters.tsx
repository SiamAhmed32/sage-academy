"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";

type BatchFiltersProps = { q: string; classLevel: string; genderGroup: string; status: string };

const inputClass = "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none";
const classLevels = [
  { value: "5", label: "৫ম শ্রেণি" }, { value: "6", label: "৬ষ্ঠ শ্রেণি" },
  { value: "7", label: "৭ম শ্রেণি" }, { value: "8", label: "৮ম শ্রেণি" },
  { value: "9", label: "৯ম শ্রেণি" }, { value: "10", label: "১০ম শ্রেণি" },
  { value: "11", label: "একাদশ শ্রেণি" }, { value: "12", label: "দ্বাদশ শ্রেণি" },
];

export function BatchFilters({ q, classLevel, genderGroup, status }: BatchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchTimerRef = useRef<number | null>(null);
  const [filters, setFilters] = useState({ q, classLevel, genderGroup: genderGroup || "all", status: status || "all" });

  const applyFilters = (next: typeof filters) => {
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.classLevel.trim()) params.set("classLevel", next.classLevel.trim());
    if (next.genderGroup !== "all") params.set("genderGroup", next.genderGroup);
    if (next.status !== "all") params.set("status", next.status);
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
        placeholder="ব্যাচ কোড, শ্রেণি বা slug দিয়ে খুঁজুন"
        className={`${inputClass} lg:col-span-4`}
      />
      <select name="classLevel" value={filters.classLevel} onChange={updateFilter} className={`${inputClass} lg:col-span-2`}>
        <option value="">সব শ্রেণি</option>
        {classLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
      </select>
      <select name="genderGroup" value={filters.genderGroup} onChange={updateFilter} className={`${inputClass} lg:col-span-2`}>
        <option value="all">সব ধরন</option>
        <option value="male">ছেলেদের ব্যাচ</option>
        <option value="female">মেয়েদের ব্যাচ</option>
        <option value="combined">কম্বাইন্ড ব্যাচ</option>
      </select>
      <select name="status" value={filters.status} onChange={updateFilter} className={`${inputClass} lg:col-span-2`}>
        <option value="all">সব স্ট্যাটাস</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="archived">Archived</option>
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

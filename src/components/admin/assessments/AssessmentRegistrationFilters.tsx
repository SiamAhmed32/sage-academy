"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, Calendar, Filter, RotateCcw, Search } from "lucide-react";

import { assessmentLeadStatusOptions } from "@/schemas/assessment";

type Props = {
  q: string;
  status: string;
  assessmentKind: string;
  assessmentType: string;
  classLabel: string;
  applicantType: string;
  sort: string;
  dateRange: string;
  limit: number;
  pageSizeOptions: number[];
  assessmentTypes: string[];
  classLabels: string[];
};

const statusLabels: Record<string, string> = {
  new: "নতুন",
  contacted: "যোগাযোগ হয়েছে",
  confirmed: "কনফার্মড",
  attended: "উপস্থিত",
  cancelled: "বাতিল",
  invalid: "ভুল তথ্য",
};

const selectBase =
  "box-border min-h-[2.75rem] w-full min-w-0 max-w-full rounded-xl border border-sage-border bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-sage-secondary shadow-sm outline-none transition focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/15 sm:text-base";

const inputBase =
  "box-border min-h-[2.75rem] w-full min-w-0 rounded-xl border border-sage-border bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-sage-secondary shadow-sm outline-none transition focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/15 sm:text-base";

export function AssessmentRegistrationFilters({
  q,
  status,
  assessmentKind,
  assessmentType,
  classLabel,
  applicantType,
  sort,
  dateRange,
  limit,
  pageSizeOptions,
  assessmentTypes,
  classLabels,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(q);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchValue.trim() !== q) {
        updateParams("q", searchValue.trim());
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [searchValue, q, updateParams]);

  function clearAll() {
    router.push("?page=1", { scroll: false });
  }

  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-sage-gray-600 sm:text-sm";

  return (
    <div className="rounded-2xl border border-sage-border bg-white p-4 pb-6 shadow-sm sm:p-6 sm:pb-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-sage-border/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-sage-secondary sm:text-xl">ফিল্টার ও সার্চ</h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-sage-gray-600 sm:text-base">
            সার্চ ও ফিল্টার এখন ডাটাবেজ থেকে কাজ করে, তাই বড় লিড লিস্টেও একইভাবে দ্রুত ফলাফল পাওয়া যাবে।
          </p>
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-sage-border bg-sage-red-50/60 px-4 py-2.5 text-sm font-bold text-sage-secondary transition hover:border-sage-primary hover:bg-sage-primary hover:text-white sm:px-5 sm:text-base"
        >
          <RotateCcw className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
          ফিল্টার সাফ করুন
        </button>
      </div>

      <div className="flex flex-col gap-5">
        <div className="min-w-0">
          <label className={labelCls} htmlFor="assessment-registration-search">
            সার্চ
          </label>
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-gray-400 sm:h-5 sm:w-5" aria-hidden />
            <input
              id="assessment-registration-search"
              className={inputBase}
              placeholder="নাম, ফোন, স্কুল, পরীক্ষা, বিষয়, নোট বা স্ট্যাটাস..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="min-w-0">
            <span className={labelCls}>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-sage-primary sm:h-4 sm:w-4" aria-hidden />
                সময়
              </span>
            </span>
            <select className={selectBase} value={dateRange} onChange={(event) => updateParams("dateRange", event.target.value)}>
              <option value="all">সব সময়</option>
              <option value="today">আজকের</option>
              <option value="week">গত ৭ দিন</option>
              <option value="month">গত ৩০ দিন</option>
            </select>
          </div>

          <div className="min-w-0">
            <span className={labelCls}>
              <span className="inline-flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 shrink-0 text-sage-primary sm:h-4 sm:w-4" aria-hidden />
                স্ট্যাটাস
              </span>
            </span>
            <select className={selectBase} value={status} onChange={(event) => updateParams("status", event.target.value)}>
              <option value="all">সব স্ট্যাটাস</option>
              {assessmentLeadStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {statusLabels[option] || option}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <span className={labelCls}>প্রোগ্রাম</span>
            <select className={selectBase} value={assessmentKind} onChange={(event) => updateParams("assessmentKind", event.target.value)}>
              <option value="all">সব প্রোগ্রাম</option>
              <option value="modelTest">Model Test</option>
              <option value="exam">Exam</option>
            </select>
          </div>

          <div className="min-w-0">
            <span className={labelCls}>পরীক্ষার ধরন</span>
            <select className={selectBase} value={assessmentType} onChange={(event) => updateParams("assessmentType", event.target.value)}>
              <option value="all">সব ধরন</option>
              {assessmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <span className={labelCls}>শ্রেণি</span>
            <select className={selectBase} value={classLabel} onChange={(event) => updateParams("classLabel", event.target.value)}>
              <option value="all">সব শ্রেণি</option>
              {classLabels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <span className={labelCls}>শিক্ষার্থী</span>
            <select className={selectBase} value={applicantType} onChange={(event) => updateParams("applicantType", event.target.value)}>
              <option value="all">সব শিক্ষার্থী</option>
              <option value="sage">SAGE student</option>
              <option value="outside">Outside student</option>
            </select>
          </div>

          <div className="min-w-0">
            <span className={labelCls}>
              <span className="inline-flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-sage-primary sm:h-4 sm:w-4" aria-hidden />
                সাজানো
              </span>
            </span>
            <select className={selectBase} value={sort} onChange={(event) => updateParams("sort", event.target.value)}>
              <option value="desc">নতুন আগে</option>
              <option value="asc">পুরানো আগে</option>
            </select>
          </div>

          <div className="min-w-0">
            <span className={labelCls}>প্রতি পৃষ্ঠায়</span>
            <select className={selectBase} value={String(limit)} onChange={(event) => updateParams("limit", event.target.value)}>
              {pageSizeOptions.map((n) => (
                <option key={n} value={String(n)}>
                  {n.toLocaleString("bn-BD")} টি
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

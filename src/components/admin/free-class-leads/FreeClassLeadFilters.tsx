"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, Calendar, Filter, RotateCcw, Search } from "lucide-react";

import { freeClassLeadStatusOptions } from "@/constants/admin";
import { toBanglaDigits } from "@/constants/class-levels";
import { freeClassOptions } from "@/constants/free-class";

type Props = {
  q: string;
  status: string;
  source: string;
  classLabel: string;
  sort: string;
  dateRange: string;
  limit: number;
  pageSizeOptions: number[];
};

function classFilterChoices() {
  const fromForm = freeClassOptions.map((o) => ({ value: o.label, label: o.label }));
  const english = [5, 6, 7, 8, 9, 10, 11, 12].map((n) => {
    return { value: `Class ${n}`, label: `ক্লাস ${toBanglaDigits(n)}` };
  });
  const legacy = { value: "রেজিস্টার্ড অ্যাকাউন্ট", label: "রেজিস্টার্ড অ্যাকাউন্ট (পুরনো)" };
  const map = new Map<string, { value: string; label: string }>();
  for (const row of [...fromForm, ...english, legacy]) {
    map.set(row.value, row);
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "bn"));
}

const selectBase =
  "box-border min-h-[2.75rem] w-full min-w-0 max-w-full rounded-xl border border-sage-border bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-sage-secondary shadow-sm outline-none transition focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/15 sm:text-base";

const inputBase =
  "box-border min-h-[2.75rem] w-full min-w-0 rounded-xl border border-sage-border bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-sage-secondary shadow-sm outline-none transition focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/15 sm:text-base";

export function FreeClassLeadFilters({
  q,
  status,
  source,
  classLabel,
  sort,
  dateRange,
  limit,
  pageSizeOptions,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(q);

  const classChoices = useMemo(() => classFilterChoices(), []);

  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue.trim() !== q) {
        updateParams("q", searchValue.trim());
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [searchValue, q, updateParams]);

  const clearAll = () => {
    router.push("?page=1", { scroll: false });
  };

  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-sage-gray-600 sm:text-sm";

  return (
    <div className="rounded-2xl border border-sage-border bg-white p-4 pb-6 shadow-sm sm:p-6 sm:pb-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-sage-border/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-sage-secondary sm:text-xl">ফিল্টার ও সার্চ</h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-sage-gray-600 sm:text-base">
            একসাথে সব রেকর্ড লোড হয় না—টেবিলে শুধু এই পৃষ্ঠার লিড দেখাবে।
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
          <label className={labelCls} htmlFor="free-lead-search">
            সার্চ
          </label>
          <div className="relative min-w-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-gray-400 sm:h-5 sm:w-5"
              aria-hidden
            />
            <input
              id="free-lead-search"
              className={inputBase}
              placeholder="নাম, মোবাইল, বিষয় বা শ্রেণী…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          <div className="min-w-0">
            <span className={labelCls}>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-sage-primary sm:h-4 sm:w-4" aria-hidden />
                সময়
              </span>
            </span>
            <select
              className={selectBase}
              value={dateRange}
              onChange={(e) => updateParams("dateRange", e.target.value)}
            >
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
            <select className={selectBase} value={status} onChange={(e) => updateParams("status", e.target.value)}>
              <option value="all">সব স্ট্যাটাস</option>
              {freeClassLeadStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <span className={labelCls}>উৎস</span>
            <select className={selectBase} value={source} onChange={(e) => updateParams("source", e.target.value)}>
              <option value="all">সব উৎস</option>
              <option value="guest">অতিথি ফর্ম</option>
              <option value="registered">লগইন করা</option>
            </select>
          </div>

          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <span className={labelCls}>শ্রেণী</span>
            <select
              className={selectBase}
              value={classLabel}
              onChange={(e) => updateParams("classLabel", e.target.value)}
            >
              <option value="all">সব শ্রেণী</option>
              {classChoices.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <span className={labelCls}>
              <span className="inline-flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-sage-primary sm:h-4 sm:w-4" aria-hidden />
                সাজানো
              </span>
            </span>
            <select className={selectBase} value={sort} onChange={(e) => updateParams("sort", e.target.value)}>
              <option value="desc">নতুন আগে</option>
              <option value="asc">পুরানো আগে</option>
            </select>
          </div>

          <div className="min-w-0">
            <span className={labelCls}>প্রতি পৃষ্ঠায়</span>
            <select
              className={selectBase}
              value={String(limit)}
              onChange={(e) => updateParams("limit", e.target.value)}
            >
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

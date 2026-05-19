"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PaymentFilters } from "./PaymentManager";
import { methodLabels, monthLabels, months } from "./payment-options";

type Props = { filters: PaymentFilters; totalPayments: number; limit: number };

function buildQuery(next: PaymentFilters, page: number, limit: number) {
  const params = new URLSearchParams();
  const q = next.q.trim();
  if (q) params.set("q", q);
  if (next.month) params.set("month", next.month);
  if (next.year) params.set("year", next.year);
  if (next.status) params.set("status", next.status);
  if (next.method) params.set("method", next.method);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return params.toString();
}

export function PaymentFiltersPanel({ filters, totalPayments, limit }: Props) {
  const router = useRouter();
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => String(currentYear - i));

  const [qInput, setQInput] = useState(filters.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQInput(filters.q);
  }, [filters.q]);

  const navigate = useCallback(
    (next: PaymentFilters) => {
      const qs = buildQuery(next, 1, limit);
      router.push(`/admin/payments?${qs}`, { scroll: false });
    },
    [router, limit]
  );

  const pushPatch = useCallback(
    (patch: Partial<PaymentFilters>) => {
      navigate({ ...filters, ...patch });
    },
    [filters, navigate]
  );

  const scheduleSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const latest = filtersRef.current;
      navigate({ ...latest, q });
    }, 400);
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="border-b border-sage-border bg-sage-red-50/10 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sage-secondary">পেমেন্ট লেজার</h3>
          <p className="text-sm text-sage-gray-500">ডিফল্টভাবে চলতি মাস দেখানো হয়। পুরোনো রেকর্ড দেখতে ফিল্টার ব্যবহার করুন।</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-sage-primary ring-1 ring-sage-border">
          {totalPayments} রেকর্ড
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_.8fr_.8fr_.8fr_.8fr_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-sage-gray-500" />
          <input
            value={qInput}
            onChange={(e) => {
              const v = e.target.value;
              setQInput(v);
              scheduleSearch(v);
            }}
            placeholder="শিক্ষার্থীর নাম বা আইডি দিয়ে খুঁজুন..."
            className="h-11 w-full rounded-xl border border-sage-border pl-10 pr-4 text-sm outline-none focus:border-sage-primary"
          />
        </label>
        <FilterSelect value={filters.month} onChange={(month) => pushPatch({ month })}>
          <option value="all">সব মাস</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabels[m]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={filters.year} onChange={(year) => pushPatch({ year })}>
          <option value="all">সব বছর</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={filters.status} onChange={(status) => pushPatch({ status })}>
          <option value="all">সব স্ট্যাটাস</option>
          <option value="due">শুধু বকেয়া</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">আংশিক</option>
          <option value="paid">Paid</option>
        </FilterSelect>
        <FilterSelect value={filters.method} onChange={(method) => pushPatch({ method })}>
          <option value="all">সব মাধ্যম</option>
          {Object.entries(methodLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FilterSelect>
        <div className="flex items-center">
          <a
            href="/admin/payments"
            className="grid h-11 w-full place-items-center rounded-xl border border-sage-border bg-white px-4 text-sm font-bold text-sage-secondary xl:w-auto"
          >
            রিসেট
          </a>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 rounded-xl border border-sage-border bg-white px-3 text-sm text-sage-secondary outline-none focus:border-sage-primary"
    >
      {children}
    </select>
  );
}

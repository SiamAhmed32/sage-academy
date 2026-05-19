"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useState } from "react";

import { monthNameFromNumber } from "@/lib/month-utils";

type PaymentFilterState = {
  year: string;
  month: string;
  status: string;
};

type Props = PaymentFilterState & {
  years: number[];
};

const inputClass = "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm font-bold text-sage-secondary outline-none";

function buildPaymentQuery(filters: PaymentFilterState) {
  const params = new URLSearchParams();

  if (filters.year.trim()) params.set("year", filters.year.trim());
  if (filters.month && filters.month !== "all") params.set("month", filters.month);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);

  return params.toString();
}

export function StudentPaymentFilters({ years, year, month, status }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<PaymentFilterState>({
    year,
    month: month || "all",
    status: status || "all",
  });

  const applyFilters = useCallback(
    (nextFilters: PaymentFilterState) => {
      const query = buildPaymentQuery(nextFilters);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  function updateFilter(event: ChangeEvent<HTMLSelectElement>) {
    const { name, value } = event.target;
    const nextFilters = { ...filters, [name]: value };
    setFilters(nextFilters);
    applyFilters(nextFilters);
  }

  return (
    <div className="mb-5 grid gap-3 rounded-xl border border-sage-border bg-sage-white p-4 lg:grid-cols-12">
      <select
        name="year"
        value={filters.year}
        onChange={updateFilter}
        className={`${inputClass} lg:col-span-3`}
      >
        {years.map((optionYear) => (
          <option key={optionYear} value={optionYear}>
            {optionYear}
          </option>
        ))}
      </select>

      <select
        name="month"
        value={filters.month}
        onChange={updateFilter}
        className={`${inputClass} lg:col-span-4`}
      >
        <option value="all">All months</option>
        {Array.from({ length: 12 }, (_, index) => index + 1).map((monthNumber) => (
          <option key={monthNumber} value={monthNumber}>
            {monthNameFromNumber(monthNumber)}
          </option>
        ))}
      </select>

      <select
        name="status"
        value={filters.status}
        onChange={updateFilter}
        className={`${inputClass} lg:col-span-3`}
      >
        <option value="all">All statuses</option>
        <option value="paid">Paid</option>
        <option value="partial">Partial</option>
        <option value="unpaid">Unpaid</option>
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

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type PaginationProps = {
  totalPages: number;
  currentPage: number;
  /** When set with pageSize, shows "Showing X–Y of Z" under controls. */
  totalItems?: number;
  pageSize?: number;
  /** If true, still render summary when only one page (useful for “per page” context). */
  showWhenSinglePage?: boolean;
};

function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const delta = 2;
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({
  totalPages,
  currentPage,
  totalItems,
  pageSize,
  showWhenSinglePage,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const showNav = totalPages > 1;
  const showBlock = showNav || (showWhenSinglePage && (totalItems ?? 0) > 0);

  if (!showBlock) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    router.push(createPageUrl(page), { scroll: false });
  };

  const pages = buildPageList(currentPage, totalPages);

  const from =
    totalItems != null && pageSize != null && totalItems > 0
      ? (currentPage - 1) * pageSize + 1
      : null;
  const to =
    totalItems != null && pageSize != null && totalItems > 0
      ? Math.min(currentPage * pageSize, totalItems)
      : null;

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      {showNav ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-sage-border bg-white text-base transition hover:bg-sage-red-50 disabled:opacity-30 disabled:hover:bg-white md:h-12 md:w-12"
            aria-label="আগের পৃষ্ঠা"
          >
            <ChevronLeft size={22} className="text-sage-secondary" />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {pages.map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`e-${idx}`}
                  className="flex h-11 min-w-11 items-center justify-center px-2 text-base font-bold text-sage-gray-400 md:h-12"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => handlePageChange(item)}
                  className={`flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-base font-bold transition md:h-12 md:min-w-12 ${
                    currentPage === item
                      ? "border-sage-primary bg-sage-primary text-white"
                      : "border-sage-border bg-white text-sage-secondary hover:bg-sage-red-50"
                  }`}
                >
                  {item.toLocaleString("bn-BD")}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-sage-border bg-white text-base transition hover:bg-sage-red-50 disabled:opacity-30 disabled:hover:bg-white md:h-12 md:w-12"
            aria-label="পরের পৃষ্ঠা"
          >
            <ChevronRight size={22} className="text-sage-secondary" />
          </button>
        </div>
      ) : null}

      {from != null && to != null && totalItems != null ? (
        <p className="text-center text-base font-medium text-sage-gray-600">
          এই পৃষ্ঠায়{" "}
          <span className="font-bold text-sage-secondary">
            {from.toLocaleString("bn-BD")}–{to.toLocaleString("bn-BD")}
          </span>{" "}
          নম্বর রেকর্ড · মোট{" "}
          <span className="font-bold text-sage-secondary">{totalItems.toLocaleString("bn-BD")}</span> টি
        </p>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import type { PaymentFilters, PaymentPaginationState } from "./PaymentManager";

type Props = { filters: PaymentFilters; pagination: PaymentPaginationState };

function pageHref(filters: PaymentFilters, page: number, limit: number) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
  params.set("page", String(page));
  params.set("limit", String(limit));
  return `/admin/payments?${params.toString()}`;
}

export function PaymentPagination({ filters, pagination }: Props) {
  const totalPages = Math.max(1, Math.ceil(pagination.totalPayments / pagination.limit));
  const start = pagination.totalPayments ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const end = Math.min(pagination.totalPayments, pagination.page * pagination.limit);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sage-border px-4 py-3 text-sm">
      <p className="text-sage-gray-500">
        দেখানো হচ্ছে <span className="font-bold text-sage-secondary">{start}-{end}</span> / <span className="font-bold text-sage-secondary">{pagination.totalPayments}</span>
      </p>
      <div className="flex items-center gap-2">
        <PageButton disabled={pagination.page <= 1} href={pageHref(filters, pagination.page - 1, pagination.limit)}>আগের</PageButton>
        <span className="rounded-lg bg-sage-red-50 px-3 py-2 text-sm font-bold text-sage-primary">
          পৃষ্ঠা {pagination.page} / {totalPages}
        </span>
        <PageButton disabled={pagination.page >= totalPages} href={pageHref(filters, pagination.page + 1, pagination.limit)}>পরের</PageButton>
      </div>
    </div>
  );
}

function PageButton({ disabled, href, children }: { disabled: boolean; href: string; children: React.ReactNode }) {
  if (disabled) {
    return <span className="rounded-lg border border-sage-border px-3 py-2 text-sm font-bold text-sage-gray-500 opacity-50">{children}</span>;
  }
  return <Link href={href} className="rounded-lg border border-sage-border bg-white px-3 py-2 text-sm font-bold text-sage-secondary hover:border-sage-primary hover:text-sage-primary">{children}</Link>;
}

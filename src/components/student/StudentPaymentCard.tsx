import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";

type PaymentCardProps = {
  payment?: { amount?: number; expectedAmount?: number; dueAmount?: number; status?: string } | null;
  month: string;
  year: number;
  compact?: boolean;
  viewAllHref?: string;
  totalDue?: number;
  overdueCount?: number;
};

function money(value = 0) {
  return `৳${Number(value || 0).toLocaleString("bn-BD")}`;
}

function statusLabel(payment?: PaymentCardProps["payment"]) {
  if (!payment) return "রেকর্ড নেই";
  if ((payment.dueAmount || 0) <= 0 && (payment.amount || 0) > 0) return "পরিশোধিত";
  if ((payment.amount || 0) > 0) return "আংশিক";
  return "অপরিশোধিত";
}

function statusTone(payment?: PaymentCardProps["payment"]) {
  const label = statusLabel(payment);
  if (label === "পরিশোধিত") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (label === "অপরিশোধিত") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-sage-red-50 text-sage-primary ring-sage-red-100";
}

export function StudentPaymentCard({
  payment,
  month,
  year,
  compact,
  viewAllHref,
  totalDue = 0,
  overdueCount = 0,
}: PaymentCardProps) {
  const label = statusLabel(payment);

  return (
    <section className="rounded-xl border border-sage-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-sage-red-50 p-3 text-sage-primary">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-sage-secondary">এই মাসের পেমেন্ট</h2>
            <p className="mt-1 text-sm text-sage-gray-500">
              {month} {year}
              {overdueCount > 0 ? ` · ${overdueCount} মাস বকেয়া` : ""}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusTone(payment)}`}>
          {label}
        </span>
      </div>

      <div className={`mt-5 grid gap-3 ${compact ? "sm:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-4"}`}>
        <div className="rounded-xl bg-sage-red-50/60 p-4">
          <p className="text-sm font-semibold text-sage-gray-500">এই মাস পাওনা</p>
          <p className="mt-2 text-2xl font-black text-sage-secondary">{money(payment?.expectedAmount)}</p>
        </div>
        <div className="rounded-xl bg-sage-red-50/60 p-4">
          <p className="text-sm font-semibold text-sage-gray-500">এই মাস জমা</p>
          <p className="mt-2 text-2xl font-black text-sage-secondary">{money(payment?.amount)}</p>
        </div>
        <div className="rounded-xl bg-sage-red-50/60 p-4">
          <p className="text-sm font-semibold text-sage-gray-500">এই মাস বকেয়া</p>
          <p className="mt-2 text-2xl font-black text-sage-secondary">{money(payment?.dueAmount)}</p>
        </div>
        <div className={`rounded-xl p-4 ${totalDue > 0 ? "bg-amber-50/80" : "bg-emerald-50/70"}`}>
          <p className="text-sm font-semibold text-sage-gray-500">মোট বকেয়া</p>
          <p className="mt-2 text-2xl font-black text-sage-secondary">{money(totalDue)}</p>
        </div>
      </div>

      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-sage-primary"
        >
          বিস্তারিত দেখুন <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </section>
  );
}


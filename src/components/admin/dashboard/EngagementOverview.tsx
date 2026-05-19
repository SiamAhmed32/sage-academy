import Link from "next/link";
import { Activity, ArrowUpRight } from "lucide-react";

import type { EngagementAnalytics } from "@/types/engagement-analytics";

function shortDay(dateKey: string) {
  const p = dateKey.split("-").map(Number);
  return `${p[2]}/${p[1]}`;
}

export function EngagementOverview({
  analytics,
  days,
}: {
  analytics: EngagementAnalytics;
  days: number;
}) {
  const max = Math.max(1, ...analytics.byDay.map((row) => row.count));
  const hasData = analytics.byDay.some((row) => row.count > 0);

  return (
    <section className="rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-sage-secondary">
              ওয়েবসাইটে আগ্রহ
            </h3>
            <p className="mt-1 text-sm leading-6 text-sage-gray-500">
              শেষ {days} দিনে {analytics.totalInRange}টি গুরুত্বপূর্ণ ভিজিটর কাজ।
            </p>
          </div>
        </div>
        <Link
          href="/admin/engagement"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-sage-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-sage-secondary"
        >
          বিস্তারিত দেখুন
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {hasData ? (
        <div className="flex h-32 items-end gap-2 rounded-xl bg-sage-red-50/40 px-3 pb-3 pt-6">
          {analytics.byDay.map((row) => (
            <div key={row.dateKey} className="flex min-w-8 flex-1 flex-col items-center gap-2">
              <div className="flex h-20 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-sage-primary"
                  style={{ height: `${Math.max(6, (row.count / max) * 100)}%` }}
                  title={`${row.dateKey}: ${row.count}`}
                />
              </div>
              <span className="text-[10px] font-semibold text-sage-gray-500">
                {shortDay(row.dateKey)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-sage-border bg-sage-red-50/30 px-4 py-8 text-center text-sm leading-6 text-sage-gray-500">
          এখনো ভিজিটর অ্যাক্টিভিটি নেই।
        </div>
      )}
    </section>
  );
}

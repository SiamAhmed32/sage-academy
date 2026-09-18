import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardMetric } from "./types";

export function DashboardMetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metric.icon;

  return (
    <Link
      href={metric.href}
      className={cn(
        "group rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-sage-primary/40 hover:shadow-sm",
        metric.urgent && "border-sage-primary/30 bg-sage-red-50/20"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {metric.title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 tracking-tight">
            {metric.value}
          </p>
        </div>
        <span className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
          metric.urgent
            ? "bg-sage-primary text-white"
            : "bg-sage-red-50 text-sage-primary"
        )}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500 font-medium truncate">
          {metric.note}
        </p>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-300 opacity-0 transition group-hover:opacity-100 group-hover:text-sage-primary">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

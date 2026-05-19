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
        "group rounded-xl border border-sage-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sage-primary hover:shadow-md sm:p-5",
        metric.urgent && "border-sage-primary bg-sage-red-50/30"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-sage-gray-600">{metric.title}</p>
          <p className="mt-2 text-3xl font-black text-sage-secondary">
            {metric.value}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm leading-6 text-sage-gray-500">{metric.note}</p>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-sage-gray-400 transition group-hover:text-sage-primary" />
      </div>
    </Link>
  );
}

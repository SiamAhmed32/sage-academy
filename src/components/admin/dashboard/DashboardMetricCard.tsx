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
        "group relative overflow-hidden rounded-2xl border border-sage-border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sage-primary hover:shadow-lg",
        metric.urgent && "border-sage-primary/50 bg-sage-red-50/20"
      )}
    >
      {/* Visual background gradient glow on hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sage-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-sage-gray-500 group-hover:text-sage-secondary transition-colors duration-200">
            {metric.title}
          </p>
          <p className="mt-2 text-3xl font-black text-sage-secondary tracking-tight">
            {metric.value}
          </p>
        </div>
        <span className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
          metric.urgent
            ? "bg-sage-primary text-white"
            : "bg-sage-red-50 text-sage-primary group-hover:bg-sage-primary group-hover:text-white"
        )}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-sage-border/50 pt-3">
        <p className="text-xs text-sage-gray-500 font-medium truncate">
          {metric.note}
        </p>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-red-50 text-sage-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

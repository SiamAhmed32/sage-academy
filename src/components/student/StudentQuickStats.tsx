import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type QuickStat = {
  label: string;
  value: string;
  note: string;
  href: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning";
};

export function StudentQuickStats({ stats }: { stats: QuickStat[] }) {
  const toneClass = {
    default: "bg-white text-sage-primary",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl border border-sage-border bg-white p-4 shadow-sm transition hover:border-sage-primary/30 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`rounded-lg p-2.5 ${toneClass[stat.tone ?? "default"]}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-sage-gray-400 group-hover:text-sage-primary">
                দেখুন →
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold text-sage-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-black text-sage-secondary">{stat.value}</p>
            <p className="mt-2 text-sm text-sage-gray-500">{stat.note}</p>
          </Link>
        );
      })}
    </div>
  );
}

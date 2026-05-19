import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  className?: string;
};

export function StatCard({ title, value, note, icon: Icon, className = "" }: StatCardProps) {
  return (
    <div className={`rounded-xl border border-sage-border bg-white p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sage-gray-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-sage-secondary">
            {value}
          </h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-4 text-sm text-sage-gray-500">{note}</p>
    </div>
  );
}

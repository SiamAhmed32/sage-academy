import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  className?: string;
};

// Shared by the older admin pages; styled like the new workspace KPI cards.
export function StatCard({ title, value, note, icon: Icon, className = "" }: StatCardProps) {
  return (
    <article className={`kpi-card ${className}`}>
      <span className="kpi-icon kpi-brand">
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <span>{title}</span>
      <strong>{value}</strong>
      <small className="muted">{note}</small>
    </article>
  );
}

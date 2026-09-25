import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";

import { initials } from "@/lib/academy/codes";

export function PageHeading({
  eyebrow = "Admin workspace",
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <>
      {back ? (
        <Link href={back.href} className="back-link">
          <ArrowLeft size={15} /> {back.label}
        </Link>
      ) : null}
      <section className="page-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="heading-actions">{actions}</div> : null}
      </section>
    </>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title ? (
        <div className="panel-head">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {bodyClassName === undefined ? children : <div className={bodyClassName}>{children}</div>}
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="panel-link">
      {children} <ArrowRight size={14} />
    </Link>
  );
}

export function MiniStats({ children }: { children: ReactNode }) {
  return <div className="mini-stats">{children}</div>;
}

export function MiniStat({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <article className="mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

const sparkHeights = [30, 55, 45, 70, 57, 90];

export function KpiCard({
  label,
  value,
  note,
  noteTone = "good",
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  noteTone?: "good" | "warn" | "muted";
  icon: LucideIcon;
  tone: "blue" | "green" | "purple" | "brand" | "orange";
  href?: string;
}) {
  const content = (
    <>
      <span className={`kpi-icon kpi-${tone}`}>
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small className={noteTone === "good" ? "" : noteTone}>{note}</small> : null}
      <span className={`spark kpi-${tone}`} style={{ background: "none" }} aria-hidden="true">
        {sparkHeights.map((height) => (
          <i key={height} style={{ height: `${height}%` }} />
        ))}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="kpi-card">
      {content}
    </Link>
  ) : (
    <article className="kpi-card">{content}</article>
  );
}

export type ChipTone = "success" | "warning" | "info" | "danger" | "neutral";

export function StatusChip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  return (
    <span className={`status ${tone}`}>
      <i />
      {children}
    </span>
  );
}

export function Avatar({ name, size }: { name: string; size?: "sm" | "lg" }) {
  return <span className={`sa-avatar${size ? ` ${size}` : ""}`}>{initials(name)}</span>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={24} />
      </div>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function SeatMeter({ used, capacity }: { used: number; capacity: number }) {
  const ratio = capacity > 0 ? used / capacity : 0;
  const tone = ratio >= 1 ? "full" : ratio >= 0.85 ? "warn" : "";
  return (
    <div className="seat-meter" title={`${used} of ${capacity} seats filled`}>
      <span>
        <b className={tone} style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }} />
      </span>
      <small>
        {used}/{capacity}
      </small>
    </div>
  );
}

export function dueTone(status: string): ChipTone {
  if (status === "paid") return "success";
  if (status === "partial") return "info";
  if (status === "void") return "neutral";
  return "warning";
}

export function dueStatusLabel(status: string) {
  return (
    { paid: "Paid", partial: "Partly paid", unpaid: "Unpaid", void: "Cancelled" } as Record<string, string>
  )[status] ?? status;
}

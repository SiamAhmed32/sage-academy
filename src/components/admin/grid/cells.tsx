"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { ColDef } from "ag-grid-community";
import { Eye, Pencil, Trash2, type LucideIcon } from "lucide-react";

import { formatDate, formatTaka, initials } from "@/lib/academy/codes";
import { SetFilter, type SetFilterOption } from "./SetFilter";

// ───────────── Column helpers ─────────────

// "field" is left to the caller so column defs keep their row typing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ColHelper = Pick<ColDef<any>, "filter" | "filterParams" | "valueFormatter" | "cellClass" | "headerClass" | "sortable" | "hide" | "width" | "minWidth">;

export const textCol = (extra: ColHelper = {}): ColHelper => ({ filter: "agTextColumnFilter", ...extra });
export const numberCol = (extra: ColHelper = {}): ColHelper => ({ filter: "agNumberColumnFilter", ...extra });
export const dateCol = (extra: ColHelper = {}): ColHelper => ({
  filter: "agDateColumnFilter",
  valueFormatter: ({ value }) => (value ? formatDate(String(value)) : "—"),
  ...extra,
});
export const setCol = (options: { value: string | number; label: string }[], extra: ColHelper = {}): ColHelper => ({
  filter: SetFilter,
  filterParams: { options: options.map((option): SetFilterOption => ({ value: String(option.value), label: option.label })) },
  ...extra,
});
export const moneyCol = (extra: ColHelper = {}): ColHelper => ({
  filter: "agNumberColumnFilter",
  valueFormatter: ({ value }) => (value === null || value === undefined ? "—" : formatTaka(Number(value))),
  ...extra,
});

// ───────────── Cells ─────────────

/** First column: icon tile or avatar + bold title + muted subtitle (Goraya Doors style). */
export function TitleCell({
  title,
  sub,
  href,
  icon: Icon,
  avatar,
}: {
  title: ReactNode;
  sub?: ReactNode;
  href?: string;
  icon?: LucideIcon;
  avatar?: string;
}) {
  const inner = (
    <>
      {Icon ? (
        <span className="sa-grid-icon-tile">
          <Icon size={16} />
        </span>
      ) : avatar !== undefined ? (
        <span className="sa-avatar sm">{initials(avatar || "?")}</span>
      ) : null}
      <span className="sa-grid-title-copy">
        <b>{title}</b>
        {sub ? <small>{sub}</small> : null}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="sa-grid-title">
      {inner}
    </Link>
  ) : (
    <span className="sa-grid-title">{inner}</span>
  );
}

export type PillTone = "success" | "warning" | "info" | "danger" | "neutral";

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <span className={`sa-pill ${tone}`}>{children}</span>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <span className="sa-grid-muted">{children}</span>;
}

/** Pinned right-hand action icons: view / edit / delete + anything custom. */
export function ActionIcons({
  viewHref,
  onView,
  onEdit,
  onDelete,
  children,
}: {
  viewHref?: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="sa-grid-actions" onClick={(event) => event.stopPropagation()}>
      {viewHref ? (
        <Link href={viewHref} className="sa-grid-icon-btn" title="View" aria-label="View">
          <Eye size={16} />
        </Link>
      ) : onView ? (
        <button type="button" className="sa-grid-icon-btn" onClick={onView} title="View" aria-label="View">
          <Eye size={16} />
        </button>
      ) : null}
      {onEdit ? (
        <button type="button" className="sa-grid-icon-btn" onClick={onEdit} title="Edit" aria-label="Edit">
          <Pencil size={15} />
        </button>
      ) : null}
      {children}
      {onDelete ? (
        <button type="button" className="sa-grid-icon-btn danger" onClick={onDelete} title="Delete" aria-label="Delete">
          <Trash2 size={15} />
        </button>
      ) : null}
    </div>
  );
}

export function IconAction({
  icon: Icon,
  label,
  onClick,
  href,
  tone,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: "danger" | "success";
  disabled?: boolean;
}) {
  const className = `sa-grid-icon-btn${tone ? ` ${tone}` : ""}`;
  return href ? (
    <Link href={href} className={className} title={label} aria-label={label}>
      <Icon size={15} />
    </Link>
  ) : (
    <button type="button" className={className} onClick={onClick} title={label} aria-label={label} disabled={disabled}>
      <Icon size={15} />
    </button>
  );
}

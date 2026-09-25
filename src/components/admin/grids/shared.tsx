"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import type { SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import { TitleCell } from "@/components/admin/grid/cells";
import { Modal } from "@/components/admin/sa/Modal";

// ───────────── Refresh a grid from outside it (e.g. a create button in the page heading) ─────────────

const REFRESH_EVENT = "sa-grid:refresh";

export function requestGridRefresh(source: string) {
  window.dispatchEvent(new CustomEvent(REFRESH_EVENT, { detail: source }));
}

export function useGridRefreshListener(source: string, gridRef: RefObject<SaDataGridHandle | null>) {
  useEffect(() => {
    const onRefresh = (event: Event) => {
      if ((event as CustomEvent<string>).detail === source) gridRef.current?.refresh(true);
    };
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, [source, gridRef]);
}

// ───────────── Cells ─────────────

export const yesNoOptions = (yes: string, no: string) => [
  { value: "true", label: yes },
  { value: "false", label: no },
];

/** TitleCell with a small photo when the record has one; falls back to an icon or initials. */
export function ThumbTitle({
  image,
  title,
  sub,
  href,
  icon,
  avatar,
  wide = false,
}: {
  image?: string;
  title: ReactNode;
  sub?: ReactNode;
  href?: string;
  icon?: LucideIcon;
  avatar?: string;
  /** Landscape thumbnail (e.g. a promotion card banner). */
  wide?: boolean;
}) {
  if (!image) return <TitleCell title={title} sub={sub} href={href} icon={icon} avatar={icon ? undefined : avatar} />;
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny grid thumbnail from any upload host */}
      <img
        src={image}
        alt=""
        loading="lazy"
        style={{
          width: wide ? 54 : 36,
          height: 36,
          borderRadius: 8,
          objectFit: "cover",
          flexShrink: 0,
          background: "var(--brand-tint)",
          border: "1px solid var(--line, #e6e8ef)",
        }}
      />
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

/** A clickable title cell (opens a view/edit modal instead of a page). */
export function ButtonTitle({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", minWidth: 0, width: "100%", height: "100%" }}
    >
      {children}
    </button>
  );
}

// ───────────── Confirm dialog ─────────────

export type ConfirmRequest = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  run: () => Promise<void>;
};

/** One confirm modal per grid, rendered outside the grid so it is not clipped by rows. */
export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  if (!request) return null;
  return (
    <Modal
      open
      onClose={() => (busy ? undefined : onClose())}
      title={request.title}
      actions={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={request.danger ? "btn-danger" : "btn-primary"}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await request.run();
                onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Working…" : request.confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0 }}>{request.description}</p>
    </Modal>
  );
}

/** Reads a JSON API response and throws its message when it failed. */
export async function readApiResult(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") ?? "";
  const json = contentType.includes("application/json") ? await response.json().catch(() => null) : null;
  if (!response.ok || (json && json.success === false)) throw new Error(json?.message || fallback);
  return json;
}

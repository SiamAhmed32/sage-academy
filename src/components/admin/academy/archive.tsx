"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Archive, ArrowLeft, RotateCcw, Trash2 } from "lucide-react";

import type { ActionResult } from "@/lib/academy/server";
import { IconAction } from "@/components/admin/grid/cells";
import { useAction } from "./use-action";

/** True when the page shows its archive (`?view=archived`). */
export function useArchiveView() {
  return useSearchParams().get("view") === "archived";
}

/** Header button: opens the archive, or goes back to the list from it. */
export function ArchiveButton({ count }: { count: number }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const inArchive = params.get("view") === "archived";
  const next = new URLSearchParams(params.toString());
  if (inArchive) next.delete("view");
  else next.set("view", "archived");
  const href = next.size ? `${pathname}?${next}` : pathname;

  return inArchive ? (
    <Link href={href} className="btn-secondary sa-archive-btn">
      <ArrowLeft size={17} /> Back to list
    </Link>
  ) : (
    <Link href={href} className="btn-secondary sa-archive-btn" title="Archived records: restore or delete them here">
      <Archive size={17} /> Archive
      <span className="sa-archive-count">{count}</span>
    </Link>
  );
}

/** Shown above an archive grid so it is clear what the page is. */
export function ArchiveBanner({ what, note }: { what: string; note?: string }) {
  return (
    <div className="sa-archive-banner">
      <Archive size={18} />
      <div>
        <strong>Archived {what}</strong>
        <span>
          Hidden from the rest of the admin panel. Restore puts them back; Delete removes them for good from the panel (kept in the
          database for records). {note}
        </span>
      </div>
    </div>
  );
}

/** Restore + Delete for one archived row. */
export function ArchivedRowActions({
  name,
  restore,
  remove,
  onDone,
}: {
  name: string;
  restore: () => Promise<ActionResult<unknown>>;
  remove: () => Promise<ActionResult<unknown>>;
  onDone: () => void;
}) {
  const { pending, run } = useAction();
  return (
    <>
      <IconAction icon={RotateCcw} label="Restore" tone="success" disabled={pending} onClick={() => run(restore, { onSuccess: onDone })} />
      <IconAction
        icon={Trash2}
        label="Delete"
        tone="danger"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Delete ${name}? It disappears from the admin panel and cannot be restored here.`)) return;
          run(remove, { onSuccess: onDone });
        }}
      />
    </>
  );
}

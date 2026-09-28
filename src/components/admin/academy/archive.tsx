"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Archive,
  ArrowLeft,
  CircleHelp,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import type { ActionResult } from "@/lib/academy/server";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { IconAction } from "@/components/admin/grid/cells";
import { useAction } from "./use-action";

/** True when the page shows its archive (`?view=archived`). */
export function useArchiveView() {
  return useSearchParams().get("view") === "archived";
}

/** The archive has its own button, so its tile is left out of the cards. */
export function splitArchiveTile(tiles: GridTile[]) {
  const archived = Number(
    tiles.find((tile) => tile.key === "archived")?.value ?? 0,
  );
  return { tiles: tiles.filter((tile) => tile.key !== "archived"), archived };
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

  return (
    <>
      <ArchiveGuideButton />
      {inArchive ? (
        <Link href={href} className="btn-secondary sa-archive-btn">
          <ArrowLeft size={17} /> Back to list
        </Link>
      ) : (
        <Link
          href={href}
          className="btn-secondary sa-archive-btn"
          title="Open the archive to restore or delete records"
        >
          <Archive size={17} /> Archive
          {count > 0 ? <span className="sa-archive-count">{count}</span> : null}
        </Link>
      )}
    </>
  );
}

// ───────────── Confirm dialog (SAGE style) ─────────────

type Confirm = {
  tone: "archive" | "restore" | "delete";
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
};

const TONE_ICON = { archive: Archive, restore: RotateCcw, delete: Trash2 };

export function ConfirmDialog({
  confirm,
  pending,
  onClose,
}: {
  confirm: Confirm | null;
  pending: boolean;
  onClose: () => void;
}) {
  if (!confirm || typeof document === "undefined") return null;
  const Icon = TONE_ICON[confirm.tone];
  const host = document.querySelector(".sa") ?? document.body;
  return createPortal(
    <div
      className="sa-modal-backdrop"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !pending && onClose()
      }
    >
      <div
        className={`sa-confirm ${confirm.tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-label={confirm.title}
      >
        <button
          type="button"
          className="sa-confirm-close"
          onClick={onClose}
          aria-label="Close"
          disabled={pending}
        >
          <X size={16} />
        </button>
        <span className="sa-confirm-icon">
          <Icon size={22} />
        </span>
        <h2>{confirm.title}</h2>
        <div className="sa-confirm-body">{confirm.body}</div>
        <div className="sa-confirm-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={
              confirm.tone === "delete" ? "btn-danger-solid" : "btn-primary"
            }
            onClick={confirm.onConfirm}
            disabled={pending}
            autoFocus
          >
            {pending ? "Working..." : confirm.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    host,
  );
}

/**
 * Archive / Restore / Delete buttons for one grid row, each behind a SAGE
 * confirm dialog. `what` is the record name, e.g. "Class 6" or "batch 06BB01".
 */
export function ArchiveRowButtons({
  what,
  archived,
  archive,
  restore,
  remove,
  archiveNote,
  deleteNote,
  onDone,
}: {
  what: string;
  archived: boolean;
  archive: () => Promise<ActionResult<unknown>>;
  restore: () => Promise<ActionResult<unknown>>;
  remove: () => Promise<ActionResult<unknown>>;
  archiveNote?: ReactNode;
  deleteNote?: ReactNode;
  onDone: () => void;
}) {
  const { pending, run } = useAction();
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  // The dialog closes straight away; a refusal shows as a toast explaining why.
  const runFrom = (action: () => Promise<ActionResult<unknown>>) => () => {
    setConfirm(null);
    run(action, { onSuccess: onDone });
  };

  return (
    <>
      {archived ? (
        <>
          <IconAction
            icon={RotateCcw}
            label="Restore"
            tone="success"
            disabled={pending}
            onClick={() =>
              setConfirm({
                tone: "restore",
                title: `Restore ${what}?`,
                body: (
                  <p>It goes back to the main list and can be used again.</p>
                ),
                confirmLabel: "Restore",
                onConfirm: runFrom(restore),
              })
            }
          />
          <IconAction
            icon={Trash2}
            label="Delete"
            tone="danger"
            disabled={pending}
            onClick={() =>
              setConfirm({
                tone: "delete",
                title: `Delete ${what}?`,
                body: (
                  <>
                    <p>
                      It will disappear from the admin panel and cannot be
                      restored from here.
                    </p>
                    {deleteNote ? (
                      <p className="sa-confirm-note">{deleteNote}</p>
                    ) : null}
                  </>
                ),
                confirmLabel: "Delete",
                onConfirm: runFrom(remove),
              })
            }
          />
        </>
      ) : (
        <IconAction
          icon={Archive}
          label="Archive"
          tone="danger"
          disabled={pending}
          onClick={() =>
            setConfirm({
              tone: "archive",
              title: `Archive ${what}?`,
              body: (
                <>
                  <p>
                    It moves to the Archive. Nothing is lost — you can restore
                    it any time.
                  </p>
                  {archiveNote ? (
                    <p className="sa-confirm-note">{archiveNote}</p>
                  ) : null}
                </>
              ),
              confirmLabel: "Archive",
              onConfirm: runFrom(archive),
            })
          }
        />
      )}
      <ConfirmDialog
        confirm={confirm}
        pending={pending}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}

// ───────────── Archive banner + guide ─────────────

const GUIDE = [
  {
    title: "Students",
    archive:
      "Anytime. The student is marked as Left, their seats are freed and no new bills are made. Old bills and receipts stay.",
    remove: "From the archive, anytime. Their receipts stay in Finance.",
  },
  {
    title: "Batches",
    archive:
      "When no student studies in it. Transfer the students, or archive them first.",
    remove: "When no active student has it as their batch.",
  },
  {
    title: "Subjects",
    archive: "When no student is taking it.",
    remove: "From the archive, anytime.",
  },
  {
    title: "Classes",
    archive:
      "When it has no active students. Its subjects and batches are archived with it, and come back when you restore the class.",
    remove:
      "When no student of that class is left on record. Its subjects and batches are deleted with it.",
  },
];

export function ArchiveGuideButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn-ghost sa-guide-btn"
        onClick={() => setOpen(true)}
      >
        <CircleHelp size={16} /> How it works
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="sa-modal-backdrop"
              onMouseDown={(event) =>
                event.target === event.currentTarget && setOpen(false)
              }
            >
              <div
                className="sa-guide"
                role="dialog"
                aria-modal="true"
                aria-label="Archive guide"
              >
                <button
                  type="button"
                  className="sa-confirm-close"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
                <span className="eyebrow">Guide</span>
                <h2>Archive, restore and delete</h2>

                <ol className="sa-guide-steps">
                  <li>
                    <span className="sa-guide-num">
                      <Archive size={16} />
                    </span>
                    <div>
                      <strong>1 · Archive</strong>
                      <p>
                        Click the archive icon on a row. The record leaves the
                        list but nothing is lost.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span className="sa-guide-num restore">
                      <RotateCcw size={16} />
                    </span>
                    <div>
                      <strong>2 · Restore</strong>
                      <p>
                        Open the Archive button at the top, then click restore
                        to bring it back.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span className="sa-guide-num delete">
                      <Trash2 size={16} />
                    </span>
                    <div>
                      <strong>3 · Delete</strong>
                      <p>
                        Only from the Archive. It disappears from the panel; the
                        database keeps a copy for records.
                      </p>
                    </div>
                  </li>
                </ol>

                <p className="sa-guide-order">
                  <strong>Order to remove a whole class:</strong> Students →
                  Batches → Subjects → Class. The panel tells you if something
                  still needs to go first.
                </p>

                <div className="sa-guide-table">
                  <div className="sa-guide-row head">
                    <span />
                    <span>Can archive</span>
                    <span>Can delete</span>
                  </div>
                  {GUIDE.map((row) => (
                    <div key={row.title} className="sa-guide-row">
                      <strong>{row.title}</strong>
                      <span>{row.archive}</span>
                      <span>{row.remove}</span>
                    </div>
                  ))}
                </div>

                <div className="sa-confirm-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setOpen(false)}
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>,
            document.querySelector(".sa") ?? document.body,
          )
        : null}
    </>
  );
}

/** Shown above an archive grid so it is clear what the page is. */
export function ArchiveBanner({ what }: { what: string }) {
  return (
    <div className="sa-archive-banner">
      <span className="sa-archive-banner-icon">
        <Archive size={18} />
      </span>
      <div>
        <strong>Archived {what}</strong>
        <span>
          Restore brings a record back. Delete removes it from the panel for
          good.
        </span>
      </div>
    </div>
  );
}

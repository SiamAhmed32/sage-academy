"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  eyebrow,
  title,
  description,
  children,
  actions,
  wide = false,
  side = false,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
  /** Slide-in panel on the right instead of a centred dialog. */
  side?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const first = dialogRef.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])");
    first?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  // Portalled into the shell root so the modal keeps the admin theme variables.
  const host = document.querySelector(".sa") ?? document.body;

  return createPortal(
    <div
      className={`sa-modal-backdrop${side ? " side" : ""}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className={`sa-modal${wide ? " wide" : ""}${side ? " sa-drawer" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sa-modal-head">
          <div>
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close" data-close>
            <X size={18} />
          </button>
        </div>
        <div className="sa-modal-body">{children}</div>
        {actions ? <div className="sa-modal-actions">{actions}</div> : null}
      </div>
    </div>,
    host
  );
}

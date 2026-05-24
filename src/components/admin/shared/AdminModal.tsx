"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Tailwind max-width class. Defaults to "max-w-2xl" */
  maxWidth?: string;
}

export function AdminModal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-2xl",
}: AdminModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sage-border bg-sage-red-50 px-6 py-4">
          <div>
            <h3 className="text-xl font-black text-sage-secondary">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-sage-gray-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-sage-gray-400 transition hover:bg-sage-red-100 hover:text-sage-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

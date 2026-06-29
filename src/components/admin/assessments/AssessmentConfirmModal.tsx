"use client";

import { AlertTriangle, Archive, Loader2, Trash2 } from "lucide-react";

type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  type: "delete" | "archive";
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function AssessmentConfirmModal({
  title,
  message,
  confirmLabel,
  type,
  isOpen,
  isProcessing,
  onClose,
  onConfirm,
}: Props) {
  if (!isOpen) return null;

  const isDelete = type === "delete";

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assessment-confirm-title"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isDelete ? "bg-red-50 text-red-600" : "bg-sage-red-50 text-sage-primary"
            }`}
          >
            {isDelete ? <Trash2 size={20} /> : <Archive size={20} />}
          </div>
          <div className="flex-1">
            <h3 id="assessment-confirm-title" className="text-base font-bold text-sage-secondary">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-sage-gray-600">{message}</p>
            {isDelete ? (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                এই কাজটি আর ফিরিয়ে আনা যাবে না।
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-sage-border px-4 py-2.5 text-sm font-bold text-sage-secondary transition hover:bg-sage-red-50 disabled:opacity-50"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
              isDelete ? "bg-red-600 text-white hover:bg-red-700" : "bg-sage-primary text-white hover:bg-sage-secondary"
            }`}
          >
            {isProcessing ? <Loader2 className="size-4 animate-spin" /> : null}
            {isProcessing ? "প্রসেসিং..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

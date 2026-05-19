"use client";

import { AlertTriangle, Trash2, Archive, RotateCcw, Loader2 } from "lucide-react";

interface AdmissionConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  type: "delete" | "archive" | "restore";
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function AdmissionConfirmModal({
  title,
  message,
  confirmLabel,
  type,
  isOpen,
  isProcessing,
  onClose,
  onConfirm,
}: AdmissionConfirmModalProps) {
  if (!isOpen) return null;

  const config = {
    delete: {
      icon: <Trash2 size={18} />,
      btnClass: "bg-red-600 hover:bg-red-700 text-white",
    },
    archive: {
      icon: <Archive size={18} />,
      btnClass: "bg-sage-primary hover:bg-sage-secondary text-white",
    },
    restore: {
      icon: <RotateCcw size={18} />,
      btnClass: "bg-green-600 hover:bg-green-700 text-white",
    },
  };

  const current = config[type];

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/45 animate-in fade-in duration-200"
      onClick={(e) => e.stopPropagation()} // STOP BUBBLING
    >
      <div 
        className="w-full max-w-md overflow-hidden rounded-xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // DOUBLE PROTECTION
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${type === 'delete' ? 'bg-red-50 text-red-600' : type === 'restore' ? 'bg-green-50 text-green-600' : 'bg-sage-red-50 text-sage-primary'}`}>
            {current.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-sage-secondary">{title}</h3>
            <p className="mt-1 text-sm text-sage-gray-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg border border-sage-border px-4 py-2 text-sm font-bold text-sage-secondary transition hover:bg-sage-red-50 disabled:opacity-50"
          >
            বাতিল
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${current.btnClass}`}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : null}
            {isProcessing ? "প্রসেসিং..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

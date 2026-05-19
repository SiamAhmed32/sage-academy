"use client";

import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

import { reversePaymentTransactionAction } from "@/app/admin/actions";

type Props = {
  paymentId: string;
  transactionId: string;
  amount: number;
  onClose: () => void;
  onReversed: (payment: unknown) => void;
};

export function ReverseReceiptModal({ paymentId, transactionId, amount, onClose, onReversed }: Props) {
  const [reason, setReason] = useState("Payment entry correction");
  const [isSaving, setIsSaving] = useState(false);

  async function reverse() {
    if (!reason.trim()) {
      toast.error("Write a reason before reversing the receipt.");
      return;
    }
    const formData = new FormData();
    formData.append("paymentId", paymentId);
    formData.append("transactionId", transactionId);
    formData.append("reason", reason.trim());
    setIsSaving(true);
    const res = await reversePaymentTransactionAction(formData);
    setIsSaving(false);
    if (res.ok && res.data) {
      toast.success("Receipt reversed. It no longer counts as paid money.");
      onReversed(res.data);
      onClose();
    } else {
      toast.error(res.message || "Could not reverse receipt.");
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-sage-border bg-amber-50 p-5">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 ring-1 ring-amber-200">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-sage-secondary">Reverse receipt</h3>
              <p className="mt-1 text-sm text-sage-gray-600">
                This keeps the receipt for audit, but removes ৳{amount} from paid totals.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-sage-gray-500 hover:bg-white hover:text-sage-primary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 p-5">
          <label className="grid gap-2 text-sm font-bold text-sage-secondary">
            Reversal reason
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-28 rounded-xl border border-sage-border px-4 py-3 text-sm font-medium outline-none focus:border-sage-primary"
            />
          </label>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            Reversed receipts cannot be used for collection reports. Create a new payment entry for the corrected amount.
          </div>
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <button type="button" onClick={onClose} className="h-12 rounded-xl border border-sage-border bg-white px-5 font-bold text-sage-secondary">
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={reverse}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sage-primary px-5 font-bold text-white shadow-lg shadow-sage-primary/15 transition hover:bg-sage-secondary disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              {isSaving ? "Reversing..." : "Reverse receipt"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

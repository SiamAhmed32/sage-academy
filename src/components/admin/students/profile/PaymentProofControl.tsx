"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { uploadPaymentProofAction } from "@/app/admin/actions";
import type { StudentPayment } from "./payment-history-utils";

export function PaymentProofControl({ payment }: { payment: StudentPayment }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const proofUrl = payment.signedProof?.url;
  const downloadHref = `/api/admin/payment-proofs/${payment._id}/download`;
  const canAttachProof = (payment.transactions || [])
    .some((transaction) => transaction.status !== "reversed" && transaction.kind !== "advance_applied" && Number(transaction.amount || 0) > 0);

  async function upload(file?: File) {
    if (!canAttachProof) {
      toast.error("Proof can only be uploaded after a payment is recorded.");
      return;
    }
    if (!file) return;
    const formData = new FormData();
    formData.append("paymentId", payment._id);
    formData.append("proof", file);
    setIsUploading(true);
    const res = await uploadPaymentProofAction(formData);
    setIsUploading(false);
    if (res.ok) {
      toast.success("Signed proof saved.");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } else {
      toast.error(res.message || "Could not upload proof.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {proofUrl && (
        <a
          href={downloadHref}
          className="inline-flex items-center gap-1 rounded-lg bg-sage-red-50 px-3 py-1 text-[10px] font-bold text-sage-primary hover:bg-sage-primary hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          Proof
        </a>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={(e) => upload(e.target.files?.[0])} />
      <button
        type="button"
        disabled={isUploading || !canAttachProof}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1 rounded-lg border border-sage-border bg-white px-3 py-1 text-[10px] font-bold text-sage-secondary hover:border-sage-primary hover:text-sage-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" />
        {!canAttachProof ? "Proof unavailable" : proofUrl ? "Replace" : isUploading ? "Saving" : "Upload"}
      </button>
    </div>
  );
}

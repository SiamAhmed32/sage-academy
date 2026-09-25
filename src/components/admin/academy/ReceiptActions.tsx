"use client";

import { useState } from "react";
import { Ban, Download, MessageCircle, Printer } from "lucide-react";

import { Modal } from "@/components/admin/sa/Modal";
import { exportElementToPdf } from "@/components/admin/sa/export-pdf";
import { voidReceiptAction } from "@/app/admin/academy/_actions/finance";
import { ErrorNotice, useAction } from "./use-action";

export function ReceiptActions({
  receiptNo,
  status,
  whatsapp,
  message,
  canVoid,
}: {
  receiptNo: string;
  status: "valid" | "void";
  whatsapp: string;
  message: string;
  canVoid: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { pending, error, run } = useAction();
  const digits = whatsapp.replace(/\D/g, "");
  const waNumber = digits ? (digits.startsWith("88") ? digits : `88${digits}`) : "";

  async function download() {
    const element = document.getElementById("receipt-document");
    if (!element) return;
    setBusy(true);
    try {
      await exportElementToPdf(element, `SAGE-receipt-${receiptNo}`, { marginMm: 6 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn-secondary" onClick={() => window.print()}>
        <Printer size={17} /> Print
      </button>
      <button type="button" className="btn-secondary" onClick={download} disabled={busy}>
        <Download size={17} /> {busy ? "Preparing..." : "Download PDF"}
      </button>
      {waNumber && status === "valid" ? (
        <a className="btn-secondary" href={`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
          <MessageCircle size={17} /> WhatsApp
        </a>
      ) : null}
      {canVoid && status === "valid" ? (
        <button type="button" className="btn-danger" onClick={() => setVoidOpen(true)}>
          <Ban size={17} /> Void
        </button>
      ) : null}
      <Modal
        open={voidOpen}
        onClose={() => setVoidOpen(false)}
        eyebrow={receiptNo}
        title="Void this receipt?"
        description="Receipts are never edited. Voiding takes the money off the bills it paid, and the receipt stays on record marked VOID. Issue a new receipt for the correct amount."
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setVoidOpen(false)}>
              Keep receipt
            </button>
            <button type="button" className="btn-danger" disabled={pending} onClick={() => run(() => voidReceiptAction(receiptNo, reason), { onSuccess: () => setVoidOpen(false) })}>
              {pending ? "Voiding..." : "Void receipt"}
            </button>
          </>
        }
      >
        <ErrorNotice message={error} />
        <label className="field">
          Reason<span className="req">*</span>
          <input className="input" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Wrong amount entered" />
        </label>
      </Modal>
    </>
  );
}

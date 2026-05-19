"use client";

import { Download } from "lucide-react";

import { downloadPaymentReceipt, type ReceiptPayment, type ReceiptTransaction } from "./payment-receipt";

export function PaymentSlipButton({ payment, transaction }: { payment: ReceiptPayment; transaction?: ReceiptTransaction }) {
  const amount = transaction?.amount ?? payment.amount;
  const reversed = transaction?.status === "reversed";
  const disabled = amount <= 0 || reversed;
  const isStatement = !transaction && (payment.transactions?.length || 0) > 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && downloadPaymentReceipt(payment, transaction)}
      className="inline-flex items-center justify-center gap-1 rounded-lg bg-sage-red-50 px-3 py-1.5 text-sm font-bold text-sage-primary transition hover:bg-sage-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-sage-red-50 disabled:hover:text-sage-primary"
    >
      <Download className="h-3.5 w-3.5" />
      {reversed ? "Reversed" : disabled ? "Receipt unavailable" : transaction ? `৳${transaction.amount} receipt` : isStatement ? "Statement" : "Receipt"}
    </button>
  );
}

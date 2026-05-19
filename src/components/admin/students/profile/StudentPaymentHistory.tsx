"use client";

import { Fragment, useState } from "react";
import { ChevronDown, Eye, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { PaymentSlipButton } from "@/components/admin/payments/PaymentSlipButton";
import { ReverseReceiptModal } from "@/components/admin/payments/ReverseReceiptModal";
import { PaymentProofControl } from "./PaymentProofControl";
import {
  bnMonthLabel,
  paidBySubject,
  paymentDateLabel,
  paymentDue,
  paymentStatus,
  statusTone,
  type StudentPayment,
} from "./payment-history-utils";

const methodLabels: Record<string, string> = {
  cash: "Cash",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "Bank",
  other: "Other",
};

type StudentPaymentTransaction = NonNullable<StudentPayment["transactions"]>[number];

function transactionAppliedAmount(transaction: StudentPaymentTransaction) {
  const lineItems = transaction.lineItems || [];
  if (!lineItems.length) return transaction.amount;
  return lineItems.reduce((sum: number, item) => (
    item.type === "advance" ? sum : sum + Number(item.paidAmount ?? item.amount ?? 0)
  ), 0);
}

export function StudentPaymentHistory({
  payments,
  monthlyTotal,
  compact = false,
}: {
  payments: StudentPayment[];
  monthlyTotal: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState<StudentPayment | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reverseTarget, setReverseTarget] = useState<{
    paymentId: string;
    transactionId: string;
    amount: number;
  } | null>(null);

  return (
    <section className={compact ? "" : "overflow-hidden rounded-xl border border-sage-border bg-white shadow-sm"}>
      {!compact ? (
        <div className="border-b border-sage-border bg-sage-red-50/40 p-4">
          <h3 className="text-lg font-bold text-sage-secondary">Payment History</h3>
          <p className="mt-1 text-sm text-sage-gray-500">Month and year wise fee tracking for this student.</p>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-sage-red-50 text-sage-secondary">
            <tr className="border-b border-sage-border">
              <th className="p-4 font-bold">Month</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold">Expected</th>
              <th className="p-4 font-bold">Paid</th>
              <th className="p-4 font-bold">Due</th>
              <th className="p-4 font-bold">Method</th>
              <th className="p-4 font-bold">Installments</th>
              <th className="p-4 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border">
            {payments.length ? (
              payments.map((payment) => {
                const expected = payment.expectedAmount || monthlyTotal;
                const due = payment.dueAmount ?? paymentDue(payment.amount, expected);
                const status = paymentStatus(payment.amount, expected);
                const installmentCount = payment.transactions?.length || 0;
                const open = expandedId === payment._id;
                const subjectPaid = paidBySubject(payment);

                return (
                  <Fragment key={payment._id}>
                    <tr className="transition hover:bg-sage-red-50/20">
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : payment._id)}
                          className="flex items-start gap-2 text-left"
                        >
                          <ChevronDown className={`mt-1 h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
                          <span>
                            <p className="font-black text-sage-secondary">
                              {bnMonthLabel(payment.month)} {payment.year}
                            </p>
                            <p className="mt-1 text-xs text-sage-gray-500">{paymentDateLabel(payment)}</p>
                          </span>
                        </button>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusTone(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-sage-secondary">৳{expected}</td>
                      <td className="p-4 font-black text-sage-primary">৳{payment.amount}</td>
                      <td className="p-4 font-bold text-sage-secondary">৳{due}</td>
                      <td className="p-4 text-sage-gray-600">
                        {methodLabels[payment.paymentMethod || ""] || (installmentCount ? "Mixed" : "—")}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(payment)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-sage-border bg-white px-3 text-xs font-bold text-sage-primary shadow-sm transition hover:bg-sage-primary hover:text-white"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {installmentCount} installment{installmentCount === 1 ? "" : "s"}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <PaymentSlipButton payment={payment} />
                          <PaymentProofControl payment={payment} />
                        </div>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="bg-sage-red-50/10">
                        <td colSpan={8} className="p-4">
                          <div className="overflow-x-auto rounded-lg border border-sage-border bg-white">
                            <table className="min-w-full text-sm">
                              <thead className="border-b border-sage-border bg-sage-red-50/50 text-xs font-bold uppercase text-sage-gray-600">
                                <tr>
                                  <th className="px-4 py-2 text-left">Subject</th>
                                  <th className="px-4 py-2 text-left">Fee</th>
                                  <th className="px-4 py-2 text-left">Discount</th>
                                  <th className="px-4 py-2 text-left">Expected</th>
                                  <th className="px-4 py-2 text-left">Paid</th>
                                  <th className="px-4 py-2 text-left">Due</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-sage-border">
                                {(payment.lineItems ?? []).map((item) => {
                                  const billed = Number(item.amount) || 0;
                                  const paidAmount = subjectPaid[item.label] || 0;
                                  const subjectDue = Math.max(0, billed - paidAmount);
                                  return (
                                    <tr key={item.label}>
                                      <td className="px-4 py-2 font-semibold text-sage-secondary">{item.label}</td>
                                      <td className="px-4 py-2">৳{item.fee}</td>
                                      <td className="px-4 py-2">৳{item.discount}</td>
                                      <td className="px-4 py-2">৳{billed}</td>
                                      <td className="px-4 py-2 text-sage-primary">৳{paidAmount}</td>
                                      <td className="px-4 py-2">৳{subjectDue}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-sm text-sage-gray-500">
                  No billing months found for this student yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedPayment ? (
        <InstallmentModal
          payment={selectedPayment}
          monthlyTotal={monthlyTotal}
          onClose={() => setSelectedPayment(null)}
          onReverse={(target) => setReverseTarget(target)}
        />
      ) : null}

      {reverseTarget ? (
        <ReverseReceiptModal
          {...reverseTarget}
          onClose={() => setReverseTarget(null)}
          onReversed={() => {
            setReverseTarget(null);
            setSelectedPayment(null);
            router.refresh();
          }}
        />
      ) : null}
    </section>
  );
}

function InstallmentModal({
  payment,
  monthlyTotal,
  onClose,
  onReverse,
}: {
  payment: StudentPayment;
  monthlyTotal: number;
  onClose: () => void;
  onReverse: (target: { paymentId: string; transactionId: string; amount: number }) => void;
}) {
  const expected = payment.expectedAmount || monthlyTotal;
  const transactions = payment.transactions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sage-secondary/50 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-sage-border bg-sage-red-50/40 p-5">
          <div>
            <h3 className="text-xl font-black text-sage-secondary">
              {payment.month} {payment.year} installments
            </h3>
            <p className="mt-1 text-sm text-sage-gray-500">
              Expected ৳{expected} · Paid ৳{payment.amount} · Due ৳{payment.dueAmount ?? paymentDue(payment.amount, expected)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sage-border bg-white text-sage-gray-500 transition hover:bg-sage-primary hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-auto p-5">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-sage-red-50 text-sage-secondary">
              <tr className="border-b border-sage-border">
                <th className="p-3 font-bold">Installment</th>
                <th className="p-3 font-bold">Amount</th>
                <th className="p-3 font-bold">Previous</th>
                <th className="p-3 font-bold">Total</th>
                <th className="p-3 font-bold">Due</th>
                <th className="p-3 font-bold">Items</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-border">
              {transactions.length ? (
                transactions.map((transaction, index) => {
                  const previousPaid = transactions
                    .slice(0, index)
                    .filter((item) => item.status !== "reversed")
                    .reduce((sum, item) => sum + transactionAppliedAmount(item), 0);
                  const appliedAmount = transactionAppliedAmount(transaction);
                  const totalAfter = transaction.status === "reversed" ? previousPaid : previousPaid + appliedAmount;
                  const remaining = Math.max(0, expected - totalAfter);

                  return (
                    <tr key={transaction._id} className={transaction.status === "reversed" ? "bg-sage-red-50/20 opacity-70" : ""}>
                      <td className="p-3 font-black text-sage-secondary">#{index + 1}</td>
                      <td className="p-3 font-black text-sage-primary">৳{transaction.amount}</td>
                      <td className="p-3 font-semibold text-sage-gray-600">৳{previousPaid}</td>
                      <td className="p-3 font-semibold text-sage-gray-600">৳{totalAfter}</td>
                      <td className="p-3 font-semibold text-sage-gray-600">৳{remaining}</td>
                      <td className="p-3 text-sage-gray-600">
                        {(transaction.lineItems || []).map((item) => item.label).join(", ") || "Payment received"}
                        {transaction.reversalReason ? (
                          <p className="mt-1 text-xs font-semibold text-amber-700">{transaction.reversalReason}</p>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-sage-red-50 px-3 py-1 text-xs font-bold text-sage-primary">
                          {transaction.status === "reversed" ? "Reversed" : "Active"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <PaymentSlipButton payment={payment} transaction={transaction} />
                          {transaction.status !== "reversed" ? (
                            <button
                              type="button"
                              onClick={() => onReverse({ paymentId: payment._id, transactionId: transaction._id, amount: transaction.amount })}
                              className="inline-flex h-9 items-center gap-1 rounded-lg border border-amber-200 px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reverse
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-sage-gray-500">
                    No installments found for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

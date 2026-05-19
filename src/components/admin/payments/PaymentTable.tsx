"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, RotateCcw, X } from "lucide-react";

import type { AdminPayment } from "./PaymentManager";
import { PaymentSlipButton } from "./PaymentSlipButton";
import { ReverseReceiptModal } from "./ReverseReceiptModal";
import { methodLabels, monthLabels } from "./payment-options";

type Props = { payments: AdminPayment[]; onUpdated?: (payment: AdminPayment) => void };
type PaymentTransaction = NonNullable<AdminPayment["transactions"]>[number];

function statusLabel(paid: number, due: number) {
  if (paid <= 0) return "Unpaid";
  if (due > 0) return "Partial";
  return "Paid";
}

function paymentAmounts(payment: AdminPayment) {
  const storedDue = payment.dueAmount ?? 0;
  const expected = Math.max(payment.expectedAmount || 0, payment.amount + storedDue);
  const due = payment.dueAmount ?? Math.max(0, expected - payment.amount);
  return { expected, due };
}

function statusClass(label: string) {
  if (label === "Paid") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (label === "Partial") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-rose-50 text-rose-700 ring-rose-100";
}

function appliedAmount(transaction: PaymentTransaction) {
  const lineItems = transaction.lineItems || [];
  if (!lineItems.length) return transaction.amount;
  return lineItems.reduce((sum, item) => (
    item.type === "advance" ? sum : sum + Number(item.paidAmount ?? item.amount ?? 0)
  ), 0);
}

export function PaymentTable({ payments, onUpdated }: Props) {
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [reverseTarget, setReverseTarget] = useState<{
    paymentId: string;
    transactionId: string;
    amount: number;
  } | null>(null);

  if (!payments.length) {
    return (
      <div className="p-16 text-center">
        <p className="text-lg font-bold text-sage-secondary">No payment record found</p>
        <p className="mt-1 text-sm text-sage-gray-500">Search a student or change filters to inspect the ledger.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead>
          <tr className="bg-sage-red-50/50 text-sm font-black text-sage-primary">
            <th className="px-5 py-4">Student</th>
            <th className="px-5 py-4">Month</th>
            <th className="px-5 py-4 text-center">Status</th>
            <th className="px-5 py-4 text-center">Expected</th>
            <th className="px-5 py-4 text-center">Paid</th>
            <th className="px-5 py-4 text-center">Due</th>
            <th className="px-5 py-4 text-center">Date</th>
            <th className="px-5 py-4 text-center">Installments</th>
            <th className="px-5 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sage-border/50">
          {payments.map((payment) => {
            const { expected, due } = paymentAmounts(payment);
            const label = statusLabel(payment.amount, due);
            const installmentCount = payment.transactions?.length || 0;

            return (
              <tr key={payment._id} className="transition-colors hover:bg-sage-red-50/30">
                <td className="px-5 py-4">
                  <p className="font-bold text-sage-secondary">{payment.student.nameEnglish}</p>
                  <p className="text-sm text-sage-gray-500">ID: {payment.student.studentId}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-sage-primary/10 px-3 py-1 text-sm font-bold text-sage-primary">
                    {monthLabels[payment.month] || payment.month} {payment.year}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${statusClass(label)}`}>
                    {label}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">৳{expected}</td>
                <td className="px-5 py-4 text-center font-black text-sage-secondary">৳{payment.amount}</td>
                <td className="px-5 py-4 text-center">৳{due}</td>
                <td className="px-5 py-4 text-center text-sm text-sage-gray-500">
                  {new Date(payment.createdAt).toLocaleDateString("bn-BD")}
                </td>
                <td className="px-5 py-4 text-center">
                  {installmentCount ? (
                    <button
                      type="button"
                      onClick={() => setSelectedPayment(payment)}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-sage-border bg-white px-3 text-sm font-bold text-sage-primary shadow-sm transition hover:bg-sage-primary hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                      {installmentCount} installment{installmentCount === 1 ? "" : "s"}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold text-sage-gray-400">None</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/students/${payment.student._id}`}
                      className="rounded-lg border border-sage-border px-3 py-1.5 text-sm font-bold text-sage-secondary hover:border-sage-primary hover:text-sage-primary"
                    >
                      View
                    </Link>
                    <PaymentSlipButton payment={payment} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedPayment ? (
        <InstallmentModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onReverse={(target) => setReverseTarget(target)}
        />
      ) : null}

      {reverseTarget ? (
        <ReverseReceiptModal
          {...reverseTarget}
          onClose={() => setReverseTarget(null)}
          onReversed={(payment) => {
            setReverseTarget(null);
            setSelectedPayment(null);
            onUpdated?.(payment as AdminPayment);
          }}
        />
      ) : null}
    </div>
  );
}

function InstallmentModal({
  payment,
  onClose,
  onReverse,
}: {
  payment: AdminPayment;
  onClose: () => void;
  onReverse: (target: { paymentId: string; transactionId: string; amount: number }) => void;
}) {
  const { expected, due } = paymentAmounts(payment);
  const transactions = payment.transactions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sage-secondary/50 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-sage-border bg-sage-red-50/40 p-5">
          <div>
            <h3 className="text-xl font-black text-sage-secondary">
              {payment.student.nameEnglish} - {monthLabels[payment.month] || payment.month} {payment.year}
            </h3>
            <p className="mt-1 text-sm text-sage-gray-500">
              Expected ৳{expected} · Paid ৳{payment.amount} · Due ৳{due}
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
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-sage-red-50 text-sage-secondary">
              <tr className="border-b border-sage-border">
                <th className="p-3 font-bold">Installment</th>
                <th className="p-3 font-bold">Received</th>
                <th className="p-3 font-bold">Applied</th>
                <th className="p-3 font-bold">Date</th>
                <th className="p-3 font-bold">Method</th>
                <th className="p-3 font-bold">Items</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-border">
              {transactions.map((transaction, index) => (
                <tr key={transaction._id} className={transaction.status === "reversed" ? "bg-sage-red-50/20 opacity-70" : ""}>
                  <td className="p-3 font-black text-sage-secondary">#{index + 1}</td>
                  <td className="p-3 font-black text-sage-primary">৳{transaction.amount}</td>
                  <td className="p-3 font-semibold text-sage-secondary">৳{appliedAmount(transaction)}</td>
                  <td className="p-3 text-sage-gray-600">{new Date(transaction.paymentDate).toLocaleDateString("bn-BD")}</td>
                  <td className="p-3 text-sage-gray-600">{methodLabels[transaction.paymentMethod] || transaction.paymentMethod}</td>
                  <td className="p-3 text-sage-gray-600">
                    {(transaction.lineItems || []).map((item) => item.label).join(", ") || "Payment received"}
                    {transaction.reversalReason ? (
                      <p className="mt-1 text-xs font-semibold text-amber-700">{transaction.reversalReason}</p>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-sage-red-50 px-3 py-1 text-xs font-bold text-sage-primary">
                      {transaction.status === "reversed" ? "Reversed" : transaction.kind === "advance_applied" ? "Advance applied" : "Active"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <PaymentSlipButton payment={payment} transaction={transaction} />
                      {transaction.status !== "reversed" && transaction.kind !== "advance_applied" ? (
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
              ))}
              {!transactions.length ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-sage-gray-500">
                    No installments found for this payment.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

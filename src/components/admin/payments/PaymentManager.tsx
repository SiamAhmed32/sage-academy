"use client";

import { useState } from "react";
import { PaymentFiltersPanel } from "./PaymentFiltersPanel";
import { PaymentPagination } from "./PaymentPagination";
import { PaymentTable } from "./PaymentTable";

export type PaymentFilters = { q: string; month: string; year: string; status: string; method: string };
export type PaymentPaginationState = { page: number; limit: number; totalPayments: number };
export type AdminPayment = {
  _id: string;
  student: { _id: string; nameEnglish: string; studentId: string };
  amount: number;
  expectedAmount?: number;
  dueAmount?: number;
  lineItems?: Array<{
    type: "tuition" | "admission" | "previous_due" | "advance" | "other";
    label: string;
    fee: number;
    discount: number;
    amount: number;
    paidAmount?: number;
    month?: string;
    year?: number;
  }>;
  transactions?: Array<{
    _id: string;
    amount: number;
    status?: "active" | "reversed";
    kind?: "payment" | "advance_applied";
    paymentMethod: string;
    paymentDate: string;
    transactionId?: string;
    receivedBy?: { _id?: string; name?: string };
    note?: string;
    reversedAt?: string;
    reversedBy?: { _id?: string; name?: string };
    reversalReason?: string;
    lineItems?: Array<{
      type: "tuition" | "admission" | "previous_due" | "advance" | "other";
      label: string;
      fee: number;
      discount: number;
      amount: number;
      paidAmount?: number;
      month?: string;
      year?: number;
    }>;
  }>;
  paymentDate: string;
  month: string;
  year: number;
  paymentMethod: string;
  transactionId?: string;
  receivedBy: { _id: string; name: string };
  status: string;
  note?: string;
  createdAt: string;
  signedProof?: { url?: string; originalName?: string; uploadedAt?: string };
};

export type StudentOption = {
  _id: string;
  nameEnglish: string;
  studentId: string;
  classLevel?: number;
  admissionDate?: string;
  selectedSubjects: Array<{ subjectName: string; baseFee?: number; monthlyFee: number }>;
};

type Props = {
  initialPayments: AdminPayment[];
  filters: PaymentFilters;
  pagination: PaymentPaginationState;
  summary: {
    expected: number;
    paid: number;
    due: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
    reversedCount: number;
  };
  automation?: {
    month: string;
    year: number;
    created: number;
    refreshed: number;
    skipped: number;
    total: number;
  } | null;
};

export function PaymentManager({ initialPayments, filters, pagination, summary, automation = null }: Props) {
  const [payments, setPayments] = useState(initialPayments);
  const upsertPayment = (payment: AdminPayment) => {
    setPayments((prev) => {
      const exists = prev.some((item) => item._id === payment._id);
      return exists ? prev.map((item) => item._id === payment._id ? payment : item) : [payment, ...prev];
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total expected" value={`৳${summary.expected}`} tone="neutral" />
        <Metric label="Collected" value={`৳${summary.paid}`} tone="paid" />
        <Metric label="Due" value={`৳${summary.due}`} tone="due" />
        <Metric
          label="Health"
          value={`${summary.paidCount}/${summary.partialCount}/${summary.unpaidCount}`}
          note={`paid / partial / unpaid · reversed ${summary.reversedCount}`}
          tone="neutral"
        />
      </div>
      {automation ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Billing automation: {automation.created} bills created, {automation.refreshed} refreshed, {automation.skipped} skipped across all active students (admission through {automation.month} {automation.year}). Daily cron also runs when CRON_SECRET is set on Vercel.
        </div>
      ) : (
        <div className="rounded-xl border border-sage-border bg-white px-4 py-3 text-sm font-semibold text-sage-gray-600">
          Billing automation runs on the current month view. Use filters to inspect older ledger records.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-sage-border bg-white">
        <PaymentFiltersPanel filters={filters} totalPayments={pagination.totalPayments} limit={pagination.limit} />
        <PaymentTable payments={payments} onUpdated={upsertPayment} />
        <PaymentPagination filters={filters} pagination={pagination} />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone: "neutral" | "paid" | "due";
}) {
  const toneClass = tone === "paid"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : tone === "due"
      ? "bg-amber-50 text-amber-700 ring-amber-100"
      : "bg-white text-sage-secondary ring-sage-border";
  return (
    <div className={`rounded-xl p-4 shadow-sm ring-1 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-widest opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      {note ? <p className="mt-1 text-xs font-semibold opacity-70">{note}</p> : null}
    </div>
  );
}

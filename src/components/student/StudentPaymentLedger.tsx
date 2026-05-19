"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, Inbox } from "lucide-react";

import {
  bnMonthLabel,
  paidBySubject,
  paymentDue,
  paymentStatus,
  statusTone,
} from "@/components/admin/students/profile/payment-history-utils";

type LedgerPayment = {
  _id: string;
  month: string;
  year: number;
  amount?: number;
  expectedAmount?: number;
  dueAmount?: number;
  lineItems?: Array<{
    type?: string;
    label: string;
    fee?: number;
    discount?: number;
    amount?: number;
  }>;
};

type StudentPaymentLedgerProps = {
  payments: LedgerPayment[];
  totalDue: number;
  overdueCount: number;
  currentMonthBn: string;
  currentYear: number;
};

function money(value = 0) {
  return `৳${Number(value || 0).toLocaleString("bn-BD")}`;
}

export function StudentPaymentLedger({
  payments,
  totalDue,
  overdueCount,
  currentMonthBn,
  currentYear,
}: StudentPaymentLedgerProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "partial" | "paid">("all");

  const filtered = useMemo(
    () =>
      payments.filter((payment) => {
        if (statusFilter === "all") return true;
        const expected = payment.expectedAmount || 0;
        return paymentStatus(payment.amount || 0, expected).toLowerCase() === statusFilter;
      }),
    [payments, statusFilter]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="মোট বকেয়া" value={money(totalDue)} tone={totalDue > 0 ? "warning" : "success"} />
        <SummaryCard
          label="বকেয়া মাস"
          value={`${overdueCount.toLocaleString("bn-BD")} টি`}
          tone={overdueCount > 0 ? "warning" : "default"}
        />
        <SummaryCard label="এই মাস" value={`${currentMonthBn} ${currentYear}`} />
      </div>

      <div className="rounded-xl border border-sage-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-sage-secondary">মাসভিত্তিক বিল</h2>
            <p className="text-sm text-sage-gray-500">প্রতিটি মাসের বিষয়ভিত্তিক বিল ও বকেয়া দেখুন।</p>
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none focus:border-sage-primary"
          >
            <option value="all">সব স্ট্যাটাস</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {filtered.length ? (
        <div className="overflow-hidden rounded-xl border border-sage-border bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-sage-red-50 text-sage-secondary">
              <tr>
                <th className="p-4">মাস</th>
                <th className="p-4">স্ট্যাটাস</th>
                <th className="p-4">পাওনা</th>
                <th className="p-4">জমা</th>
                <th className="p-4">বকেয়া</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-border">
              {filtered.map((payment) => {
                const expected = payment.expectedAmount || 0;
                const paid = payment.amount || 0;
                const due = payment.dueAmount ?? paymentDue(paid, expected);
                const status = paymentStatus(paid, expected);
                const open = openId === payment._id;
                const subjectPaid = paidBySubject(payment as never);

                return (
                  <Fragment key={payment._id}>
                    <tr className="hover:bg-sage-red-50/20">
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => setOpenId(open ? null : payment._id)}
                          className="flex items-center gap-2 text-left font-bold text-sage-secondary"
                        >
                          <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
                          {bnMonthLabel(payment.month)} {payment.year}
                        </button>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusTone(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">{money(expected)}</td>
                      <td className="p-4 font-semibold text-sage-primary">{money(paid)}</td>
                      <td className="p-4 font-semibold">{money(due)}</td>
                    </tr>
                    {open ? (
                      <tr className="bg-sage-red-50/10">
                        <td colSpan={5} className="p-4">
                          <div className="overflow-x-auto rounded-lg border border-sage-border bg-white">
                            <table className="min-w-full text-sm">
                              <thead className="border-b border-sage-border bg-sage-red-50/50 text-xs font-bold uppercase text-sage-gray-600">
                                <tr>
                                  <th className="px-4 py-2 text-left">বিষয়</th>
                                  <th className="px-4 py-2 text-left">বিল</th>
                                  <th className="px-4 py-2 text-left">ছাড়</th>
                                  <th className="px-4 py-2 text-left">পাওনা</th>
                                  <th className="px-4 py-2 text-left">জমা</th>
                                  <th className="px-4 py-2 text-left">বকেয়া</th>
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
                                      <td className="px-4 py-2">{money(item.fee)}</td>
                                      <td className="px-4 py-2">{money(item.discount)}</td>
                                      <td className="px-4 py-2">{money(billed)}</td>
                                      <td className="px-4 py-2 text-sage-primary">{money(paidAmount)}</td>
                                      <td className="px-4 py-2">{money(subjectDue)}</td>
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
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-sage-border bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-red-50 text-sage-primary">
            <Inbox className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-sage-secondary">কোনো বিল নেই</h3>
          <p className="mt-2 text-sm text-sage-gray-500">আপনার ভর্তির পর থেকে মাসভিত্তিক বিল এখানে দেখা যাবে।</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50/60"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50/60"
        : "border-sage-border bg-white";

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-sm font-semibold text-sage-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-sage-secondary">{value}</p>
    </div>
  );
}

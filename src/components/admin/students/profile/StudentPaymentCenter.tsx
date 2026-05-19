"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, Plus, ReceiptText } from "lucide-react";

import { PaymentRecordModal } from "@/components/admin/payments/PaymentRecordModal";
import type { AdminPayment, StudentOption } from "@/components/admin/payments/PaymentManager";
import { StudentPaymentHistory } from "./StudentPaymentHistory";
import type { StudentPayment } from "./payment-history-utils";
import type { StudentProfile } from "./types";

type Props = {
  student: StudentProfile;
  payments: StudentPayment[];
  monthlyTotal: number;
  mode?: "summary" | "full";
};

export function StudentPaymentCenter({ student, payments, monthlyTotal, mode = "summary" }: Props) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const studentOption: StudentOption = {
    _id: student._id,
    nameEnglish: student.nameEnglish,
    studentId: student.studentId,
    classLevel: student.classLevel,
    admissionDate: student.admissionDate,
    selectedSubjects: (student.selectedSubjects ?? []).map((subject) => ({
      subjectName: subject.subjectName,
      baseFee: subject.baseFee,
      monthlyFee: subject.monthlyFee,
    })),
  };
  const totals = useMemo(() => payments.reduce(
    (acc, payment) => {
      const expected = payment.expectedAmount || monthlyTotal;
      const paid = payment.amount || 0;
      const due = payment.dueAmount ?? Math.max(0, expected - paid);
      const cashReceived = (payment.transactions || [])
        .filter((item) => item.status !== "reversed" && item.kind !== "advance_applied")
        .reduce((sum, item) => sum + item.amount, 0);
      acc.expected += expected;
      acc.paid += paid;
      acc.due += due;
      acc.advance += Math.max(0, cashReceived - paid);
      acc.reversed += (payment.transactions || []).filter((item) => item.status === "reversed").length;
      return acc;
    },
    { expected: 0, paid: 0, due: 0, advance: 0, reversed: 0 }
  ), [payments, monthlyTotal]);
  const current = payments[0];
  const currentExpected = current?.expectedAmount || monthlyTotal;
  const currentPaid = current?.amount || 0;
  const currentDue = current?.dueAmount ?? Math.max(0, currentExpected - currentPaid);

  function saved() {
    setIsRecording(false);
    router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-sage-border bg-white shadow-sm">
      <div className="grid gap-4 border-b border-sage-border bg-sage-red-50/30 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-black text-sage-secondary">
            <CreditCard className="h-5 w-5 text-sage-primary" />
            Payment workspace
          </h3>
          <p className="mt-1 text-sm text-sage-gray-500">
            Record installments, inspect dues, download receipts, and reverse mistakes from one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsRecording(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sage-primary px-5 text-sm font-bold text-white shadow-lg shadow-sage-primary/10 hover:bg-sage-secondary"
        >
          <Plus className="h-4 w-4" />
          Add installment
        </button>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
        <PaymentMetric label="This month" value={`৳${currentExpected}`} note={`paid ৳${currentPaid} · due ৳${currentDue}`} />
        <PaymentMetric label="All expected" value={`৳${totals.expected}`} />
        <PaymentMetric label="All paid" value={`৳${totals.paid}`} />
        <PaymentMetric label="Advance" value={`৳${totals.advance}`} />
        <PaymentMetric label="Open due" value={`৳${totals.due}`} note={totals.reversed ? `${totals.reversed} reversed receipt(s)` : "no reversed receipts"} />
      </div>

      {mode === "full" ? (
        <div className="border-t border-sage-border">
          <StudentPaymentHistory payments={payments} monthlyTotal={monthlyTotal} compact />
        </div>
      ) : (
        <div className="grid gap-4 border-t border-sage-border p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-xl border border-sage-border bg-sage-red-50/20 p-4">
            <p className="text-sm font-bold text-sage-secondary">
              Current focus: {current?.month || new Date().toLocaleString("en-US", { month: "long" })} {current?.year || new Date().getFullYear()}
            </p>
            <p className="mt-1 text-sm text-sage-gray-500">
              Paid ৳{currentPaid}, due ৳{currentDue}. Full month/year history is kept on the payment page.
            </p>
          </div>
          <Link
            href={`/admin/students/${student._id}/payments`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-sage-border bg-white px-5 text-sm font-bold text-sage-primary shadow-sm transition hover:bg-sage-primary hover:text-white"
          >
            Open payments
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {isRecording ? (
        <PaymentRecordModal
          initialStudent={studentOption}
          existingPayments={payments}
          onClose={() => setIsRecording(false)}
          onSaved={saved as (payment: AdminPayment) => void}
        />
      ) : null}
    </section>
  );
}

function PaymentMetric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-sage-border bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-sage-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-sage-secondary">{value}</p>
      {note ? <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-sage-gray-500"><ReceiptText className="h-3 w-3" />{note}</p> : null}
    </div>
  );
}

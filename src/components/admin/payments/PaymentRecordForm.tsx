"use client";

import { useState } from "react";
import { toast } from "react-toastify";

import { recordPaymentAction } from "@/app/admin/actions";
import type { AdminPayment, StudentOption } from "./PaymentManager";
import { methodLabels, monthLabels, months } from "./payment-options";
import { PaymentStudentPicker } from "./PaymentStudentPicker";
import { PaymentFeeBreakdown } from "./PaymentFeeBreakdown";

type Props = { onSaved: (payment: AdminPayment) => void; onCancel: () => void };
export type PaymentStudentForForm = StudentOption;
export type PaymentRecordForForm = {
  month: string;
  year: number;
  transactions?: Array<{
    status?: "active" | "reversed";
    amount?: number;
    kind?: "payment" | "advance_applied";
    lineItems?: Array<{ type?: string; label: string; paidAmount?: number; amount?: number }>;
  }>;
};

function activePaidBySubject(payment?: PaymentRecordForForm) {
  const totals: Record<string, number> = {};
  (payment?.transactions ?? [])
    .filter((transaction) => transaction.status !== "reversed")
    .forEach((transaction) => {
      (transaction.lineItems ?? []).forEach((item) => {
        if (item.type === "advance") return;
        totals[item.label] = (totals[item.label] || 0) + Number(item.paidAmount ?? item.amount ?? 0);
      });
    });
  return totals;
}

function paymentForMonth(payments: PaymentRecordForForm[], month: string, year: number) {
  return payments.find((payment) => payment.month === month && Number(payment.year) === Number(year));
}

function recommendedSubjectPayments(
  student: StudentOption,
  month: string,
  year: number,
  payments: PaymentRecordForForm[]
) {
  const paidBySubject = activePaidBySubject(paymentForMonth(payments, month, year));
  return Object.fromEntries(
    student.selectedSubjects.map((subject) => [
      subject.subjectName,
      Math.max(0, subject.monthlyFee - (paidBySubject[subject.subjectName] || 0)),
    ])
  );
}

function activePaymentTotal(payment?: PaymentRecordForForm) {
  return (payment?.transactions ?? [])
    .filter((transaction) => transaction.status !== "reversed")
    .reduce((sum, transaction) => (
      sum + (transaction.lineItems ?? []).reduce((lineSum, item) => (
        item.type === "advance" ? lineSum : lineSum + Number(item.paidAmount ?? item.amount ?? 0)
      ), 0)
    ), 0);
}

function advanceBalance(payments: PaymentRecordForForm[]) {
  return payments.reduce((balance, payment) => (
    balance + (payment.transactions ?? []).reduce((sum, transaction) => {
      if (transaction.status === "reversed") return sum;
      const cashReceived = transaction.kind === "advance_applied" ? 0 : Number(transaction.amount) || 0;
      const applied = (transaction.lineItems ?? []).reduce((lineSum, item) => (
        item.type === "advance" ? lineSum : lineSum + Number(item.paidAmount ?? item.amount ?? 0)
      ), 0);
      return sum + cashReceived - applied;
    }, 0)
  ), 0);
}

function isBeforeAdmissionMonth(student: StudentOption | null, month: string, year: number) {
  if (!student?.admissionDate) return false;
  const admittedAt = new Date(student.admissionDate);
  if (Number.isNaN(admittedAt.getTime())) return false;
  const selectedMonthIndex = (months as readonly string[]).indexOf(month);
  if (selectedMonthIndex < 0) return false;
  const selectedMonthEnd = new Date(year, selectedMonthIndex + 1, 0, 23, 59, 59, 999);
  return admittedAt > selectedMonthEnd;
}

function isFuturePaymentMonth(month: string, year: number) {
  const selectedMonthIndex = (months as readonly string[]).indexOf(month);
  if (selectedMonthIndex < 0) return false;
  const selectedMonthStart = new Date(year, selectedMonthIndex, 1, 0, 0, 0, 0);
  return selectedMonthStart > new Date();
}

export function PaymentRecordForm({
  onSaved,
  onCancel,
  initialStudent = null,
  existingPayments = [],
}: Props & { initialStudent?: PaymentStudentForForm | null; existingPayments?: PaymentRecordForForm[] }) {
  const [isPending, setIsPending] = useState(false);
  const initialMonth = months[new Date().getMonth()];
  const initialYear = new Date().getFullYear();
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(initialStudent);
  const [month, setMonth] = useState<string>(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [subjectPayments, setSubjectPayments] = useState<Record<string, number>>(() =>
    initialStudent ? recommendedSubjectPayments(initialStudent, initialMonth, initialYear, existingPayments) : {}
  );
  const [admissionFee, setAdmissionFee] = useState(0);
  const [admissionDiscount, setAdmissionDiscount] = useState(0);
  const [admissionPaid, setAdmissionPaid] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [method, setMethod] = useState("cash");

  const tuitionFee = selectedStudent?.selectedSubjects.reduce((sum, s) => sum + s.monthlyFee, 0) || 0;
  const existingPayment = paymentForMonth(existingPayments, month, year);
  const alreadyPaid = activePaymentTotal(existingPayment);
  const currentAdvanceBalance = advanceBalance(existingPayments);
  const admissionPayable = Math.max(0, admissionFee - admissionDiscount);
  const tuitionPaid = Object.values(subjectPayments).reduce((sum, value) => sum + value, 0);
  const billPaidNow = tuitionPaid + admissionPaid;
  const amount = billPaidNow + advancePaid;
  const expectedTotal = tuitionFee + admissionPayable;
  const paidAfterThis = alreadyPaid + billPaidNow;
  const dueAmount = Math.max(0, expectedTotal - paidAfterThis);
  const status = paidAfterThis <= 0 ? "Unpaid" : dueAmount > 0 ? "Partial" : "Paid";
  const blockedByAdmissionDate = isBeforeAdmissionMonth(selectedStudent, month, year);
  const blockedByFutureMonth = isFuturePaymentMonth(month, year);
  const paymentMonthBlocked = blockedByAdmissionDate || blockedByFutureMonth;

  function handleStudentSelect(student: StudentOption) {
    setSelectedStudent(student);
    setSubjectPayments(recommendedSubjectPayments(student, month, year, existingPayments));
    setAdmissionFee(0);
    setAdmissionDiscount(0);
    setAdmissionPaid(0);
    setAdvancePaid(0);
  }

  function subjectRemaining(subjectName: string) {
    if (!selectedStudent) return 0;
    const subject = selectedStudent.selectedSubjects.find((item) => item.subjectName === subjectName);
    if (!subject) return 0;
    const paidBySubject = activePaidBySubject(paymentForMonth(existingPayments, month, year));
    return Math.max(0, subject.monthlyFee - (paidBySubject[subjectName] || 0));
  }

  function updateSubjectPayment(subjectName: string, value: number) {
    const remaining = subjectRemaining(subjectName);
    setSubjectPayments((current) => ({
      ...current,
      [subjectName]: Math.min(remaining, Math.max(0, value)),
    }));
  }

  function changeMonth(nextMonth: string) {
    setMonth(nextMonth);
    if (selectedStudent) setSubjectPayments(recommendedSubjectPayments(selectedStudent, nextMonth, year, existingPayments));
  }

  function changeYear(nextYear: number) {
    setYear(nextYear);
    if (selectedStudent) setSubjectPayments(recommendedSubjectPayments(selectedStudent, month, nextYear, existingPayments));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return toast.error("Select a student first.");
    if (blockedByAdmissionDate) return toast.error("Payment month cannot be before the student's admission month.");
    if (blockedByFutureMonth) return toast.error("Future month payments are not open yet.");
    if (amount <= 0) return toast.error("Enter payment for at least one subject, admission item, or advance credit.");

    setIsPending(true);
    const formData = new FormData();
    formData.append("studentId", selectedStudent._id);
    formData.append("amount", amount.toString());
    formData.append("tuitionFee", tuitionFee.toString());
    formData.append("tuitionItemsJson", JSON.stringify(selectedStudent.selectedSubjects));
    formData.append("paidItemsJson", JSON.stringify([
      ...selectedStudent.selectedSubjects
        .map((subject) => ({
          type: "tuition",
          label: subject.subjectName,
          fee: subject.baseFee ?? subject.monthlyFee,
          discount: Math.max(0, (subject.baseFee ?? subject.monthlyFee) - subject.monthlyFee),
          amount: subject.monthlyFee,
          paidAmount: subjectPayments[subject.subjectName] || 0,
        }))
        .filter((item) => item.paidAmount > 0),
      admissionPaid > 0
        ? {
            type: "admission",
            label: "Admission Fee",
            fee: admissionFee,
            discount: admissionDiscount,
            amount: admissionPayable,
            paidAmount: admissionPaid,
          }
        : null,
      advancePaid > 0
        ? {
            type: "advance",
            label: "Advance Credit",
            fee: advancePaid,
            discount: 0,
            amount: advancePaid,
            paidAmount: advancePaid,
          }
        : null,
    ].filter(Boolean)));
    formData.append("admissionFee", admissionFee.toString());
    formData.append("admissionDiscount", admissionDiscount.toString());
    formData.append("month", month);
    formData.append("year", year.toString());
    formData.append("paymentMethod", method);
    const res = await recordPaymentAction(formData);
    setIsPending(false);
    if (res.ok && res.data) {
      toast.success("Payment record saved.");
      onSaved(res.data as AdminPayment);
    } else {
      toast.error(res.message || "Could not record payment.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {!initialStudent ? (
        <div className="lg:col-span-3">
          <PaymentStudentPicker selectedStudent={selectedStudent} onSelect={handleStudentSelect} />
        </div>
      ) : null}

      <PaymentFeeBreakdown
        student={selectedStudent}
        admissionFee={admissionFee}
        admissionDiscount={admissionDiscount}
        paidAmount={amount}
      />

      {selectedStudent ? (
        <section className="rounded-2xl border border-sage-border bg-white p-4 lg:col-span-3">
          {paymentMonthBlocked ? (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              {blockedByAdmissionDate
                ? "This student was admitted after the selected month. Choose the admission month or a later month."
                : "Future month payments are not open yet. Choose the current month or an earlier open month."}
            </p>
          ) : null}
          <div className="mb-4">
            <h4 className="text-base font-black text-sage-secondary">Subject-wise installment</h4>
            <p className="mt-1 text-sm text-sage-gray-500">
              Each field is capped by the remaining due for that subject in the selected month.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {selectedStudent.selectedSubjects.map((subject) => {
              const remaining = subjectRemaining(subject.subjectName);
              const alreadyPaid = Math.max(0, subject.monthlyFee - remaining);
              return (
                <div key={subject.subjectName} className="rounded-xl border border-sage-border bg-sage-red-50/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sage-secondary">{subject.subjectName}</p>
                      <p className="text-xs font-semibold text-sage-gray-500">
                        Monthly ৳{subject.monthlyFee} · paid ৳{alreadyPaid} · remaining ৳{remaining}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={remaining}
                      disabled={remaining <= 0 || paymentMonthBlocked}
                      value={subjectPayments[subject.subjectName] || ""}
                      onChange={(event) => updateSubjectPayment(subject.subjectName, Number(event.target.value) || 0)}
                      className="h-10 w-28 rounded-lg border border-sage-border bg-white px-3 text-sm font-bold text-sage-secondary disabled:bg-sage-red-50 disabled:text-sage-gray-500"
                      aria-label={`${subject.subjectName} paid amount`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <Field label="Month *">
        <Select value={month} onChange={changeMonth}>
          {months.map((m) => <option key={m} value={m}>{monthLabels[m]}</option>)}
        </Select>
      </Field>
      <Field label="Year *">
        <input type="number" required value={year} onChange={(e) => changeYear(Number(e.target.value) || initialYear)} className="h-12 rounded-xl border border-sage-border px-4" />
      </Field>
      <MoneyField label="Admission fee" value={admissionFee} onChange={setAdmissionFee} />
      <MoneyField label="Admission discount" value={admissionDiscount} onChange={setAdmissionDiscount} />
      <MoneyField label="Admission paid now" value={admissionPaid} onChange={setAdmissionPaid} />
      <MoneyField label="Advance credit" value={advancePaid} onChange={setAdvancePaid} />
      <Field label="Payment method">
        <Select value={method} onChange={setMethod}>{Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
      </Field>
      <div className="rounded-xl border border-sage-border bg-sage-red-50/30 p-4 text-sm font-bold text-sage-secondary lg:col-span-2">
        Expected ৳{expectedTotal} · Already paid ৳{alreadyPaid} · Receiving ৳{amount} · Advance balance ৳{currentAdvanceBalance + advancePaid} · Due after payment ৳{dueAmount} · {status}
      </div>
      <div className="flex items-end gap-3 lg:col-span-3">
        <button type="submit" disabled={isPending || paymentMonthBlocked} className="h-12 flex-1 rounded-xl bg-sage-primary font-bold text-white disabled:opacity-50">{isPending ? "Saving..." : "Save payment"}</button>
        <button type="button" onClick={onCancel} className="h-12 rounded-xl border border-sage-border bg-white px-4 text-sm font-bold text-sage-secondary">Cancel</button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold text-sage-secondary">{label}{children}</label>;
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-xl border border-sage-border px-4">{children}</select>;
}

function MoneyField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <Field label={label}><input type="number" min="0" value={value || ""} onChange={(e) => onChange(Number(e.target.value) || 0)} className="h-12 rounded-xl border border-sage-border px-4" /></Field>;
}

import Payment from "@/models/Payment";
import Student from "@/models/Student";
import { monthNameFromNumber } from "@/lib/month-utils";

export type BillingLineItem = {
  type: "tuition" | "admission" | "previous_due" | "advance" | "other";
  label: string;
  fee: number;
  discount: number;
  amount: number;
  paidAmount?: number;
  month?: string;
  year?: number;
};

type StudentForBilling = {
  _id: unknown;
  admissionDate?: Date | string | null;
  selectedSubjects?: Array<{
    subjectName?: string;
    baseFee?: number;
    monthlyFee?: number;
  }>;
};

export function billStatus(paidAmount: number, expectedAmount: number) {
  if (expectedAmount <= 0) return "paid";
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount < expectedAmount) return "partial";
  return "paid";
}

export function tuitionLineItems(
  student: StudentForBilling,
  month: string,
  year: number
): BillingLineItem[] {
  return (student.selectedSubjects ?? []).map((subject) => {
    const fee = Math.max(
      0,
      Number(subject.baseFee ?? subject.monthlyFee) || 0
    );
    const amount = Math.max(0, Number(subject.monthlyFee) || 0);

    return {
      type: "tuition",
      label: String(subject.subjectName || "Tuition Fee"),
      fee,
      discount: Math.max(0, fee - amount),
      amount,
      month,
      year,
    };
  });
}

export function billExpectedAmount(lineItems: BillingLineItem[]) {
  return lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export function transactionTotal(transactions?: Array<{ amount?: number }>) {
  return (transactions ?? []).reduce(
    (sum, transaction) => {
      const status = "status" in transaction ? (transaction as { status?: string }).status : "active";
      return status === "reversed" ? sum : sum + (Number(transaction.amount) || 0);
    },
    0
  );
}

type LedgerTransaction = {
  amount?: number;
  status?: string;
  kind?: string;
  lineItems?: Array<{
    type?: string;
    label?: string;
    amount?: number;
    paidAmount?: number;
  }>;
};

function isAdvanceLineItem(item: { type?: string; label?: string }) {
  return item.type === "advance" || String(item.label || "").toLowerCase().includes("advance");
}

export function appliedTransactionTotal(transactions?: LedgerTransaction[]) {
  return (transactions ?? []).reduce((sum, transaction) => {
    if (transaction.status === "reversed") return sum;
    const lineItems = transaction.lineItems || [];
    if (!lineItems.length) return sum + (Number(transaction.amount) || 0);
    return sum + lineItems.reduce((lineSum, item) => {
      if (isAdvanceLineItem(item)) return lineSum;
      return lineSum + (Number(item.paidAmount ?? item.amount) || 0);
    }, 0);
  }, 0);
}

export function receivedCashTotal(transactions?: LedgerTransaction[]) {
  return (transactions ?? []).reduce((sum, transaction) => {
    if (transaction.status === "reversed" || transaction.kind === "advance_applied") return sum;
    return sum + (Number(transaction.amount) || 0);
  }, 0);
}

export async function studentAdvanceBalance(studentId: unknown) {
  const payments = await Payment.find({ student: studentId }).select("transactions amount lineItems").lean();
  return payments.reduce((balance, payment) => {
    const transactions = (payment.transactions?.length
      ? payment.transactions
      : payment.amount > 0
        ? [{ amount: payment.amount, lineItems: payment.lineItems }]
        : []) as LedgerTransaction[];
    return balance + receivedCashTotal(transactions) - appliedTransactionTotal(transactions);
  }, 0);
}

function advanceAppliedTransaction(amount: number, lineItems: BillingLineItem[], month: string, year: number) {
  return {
    amount,
    status: "active",
    kind: "advance_applied",
    paymentMethod: "other",
    paymentDate: new Date(),
    receivedBy: undefined,
    note: "Advance credit auto-applied",
    lineItems: applyAmountToLineItems(lineItems, amount, month, year),
  };
}

export function applyAmountToLineItems(
  lineItems: BillingLineItem[],
  amount: number,
  month: string,
  year: number
) {
  let remaining = Math.max(0, amount);
  return lineItems
    .map((item) => {
      const paidAmount = Math.min(remaining, Math.max(0, Number(item.amount) || 0));
      remaining -= paidAmount;
      return {
        ...item,
        paidAmount,
        month,
        year,
      };
    })
    .filter((item) => (item.paidAmount || 0) > 0);
}

function billUpdatePayload(
  lineItems: BillingLineItem[],
  paidAmount: number,
  expectedAmount: number,
  month: string,
  monthNumber: number
) {
  return {
    lineItems,
    expectedAmount,
    amount: paidAmount,
    dueAmount: Math.max(0, expectedAmount - paidAmount),
    status: billStatus(paidAmount, expectedAmount),
    month,
    monthNumber,
  };
}

export function billingMonthEnd(monthNumber: number, year: number) {
  return new Date(year, monthNumber, 0, 23, 59, 59, 999);
}

export function billingMonthStart(monthNumber: number, year: number) {
  return new Date(year, monthNumber - 1, 1, 0, 0, 0, 0);
}

export function isBillingMonthOpen(monthNumber: number, year: number, now = new Date()) {
  return billingMonthStart(monthNumber, year) <= now;
}

export function isStudentEligibleForBilling(
  student: Pick<StudentForBilling, "admissionDate">,
  monthNumber: number,
  year: number
) {
  if (!student.admissionDate) return true;
  const admittedAt = new Date(student.admissionDate);
  if (Number.isNaN(admittedAt.getTime())) return true;
  return admittedAt <= billingMonthEnd(monthNumber, year);
}

export function shouldShowStudentBillingMonth(
  student: Pick<StudentForBilling, "admissionDate">,
  monthNumber: number,
  year: number,
  now = new Date()
) {
  return isStudentEligibleForBilling(student, monthNumber, year) && isBillingMonthOpen(monthNumber, year, now);
}

export function billingMonthsBetween(
  student: Pick<StudentForBilling, "admissionDate">,
  now = new Date()
) {
  const endMonth = now.getMonth() + 1;
  const endYear = now.getFullYear();
  let startMonth = 1;
  let startYear = endYear;

  if (student.admissionDate) {
    const admittedAt = new Date(student.admissionDate);
    if (!Number.isNaN(admittedAt.getTime())) {
      startMonth = admittedAt.getMonth() + 1;
      startYear = admittedAt.getFullYear();
    }
  }

  const periods: Array<{ monthNumber: number; year: number }> = [];
  let monthNumber = startMonth;
  let year = startYear;

  while (year < endYear || (year === endYear && monthNumber <= endMonth)) {
    if (isBillingMonthOpen(monthNumber, year, now) && isStudentEligibleForBilling(student, monthNumber, year)) {
      periods.push({ monthNumber, year });
    }
    monthNumber += 1;
    if (monthNumber > 12) {
      monthNumber = 1;
      year += 1;
    }
  }

  return periods;
}

function hasAdvanceApplied(transactions?: Array<{ kind?: string; status?: string }>) {
  return (transactions ?? []).some(
    (transaction) => transaction.kind === "advance_applied" && transaction.status !== "reversed"
  );
}

export async function ensureAllBillingMonthsForStudent(studentId: string, now = new Date()) {
  const student = await Student.findOne({ _id: studentId, isActive: true })
    .select("admissionDate")
    .lean();
  if (!student) return { created: 0, refreshed: 0, skipped: 0, months: 0 };

  const periods = billingMonthsBetween(student, now);
  let created = 0;
  let refreshed = 0;
  let skipped = 0;

  for (const { monthNumber, year } of periods) {
    const result = await ensureMonthlyBillForStudent(studentId, monthNumber, year);
    created += result.created;
    refreshed += result.refreshed;
    skipped += result.skipped;
  }

  return { created, refreshed, skipped, months: periods.length };
}

export async function ensureAllBillingMonthsForActiveStudents(now = new Date()) {
  const students = await Student.find({ isActive: true }).select("_id").lean();
  let created = 0;
  let refreshed = 0;
  let skipped = 0;

  for (const student of students) {
    const result = await ensureAllBillingMonthsForStudent(String(student._id), now);
    created += result.created;
    refreshed += result.refreshed;
    skipped += result.skipped;
  }

  return { created, refreshed, skipped, total: students.length };
}

export async function ensureMonthlyBillForStudent(studentId: string, monthNumber: number, year: number) {
  const month = monthNameFromNumber(monthNumber);
  if (!month) throw new Error("Invalid billing month");

  const student = await Student.findOne({ _id: studentId, isActive: true })
    .select("selectedSubjects admissionDate")
    .lean();
  if (!student || !isStudentEligibleForBilling(student, monthNumber, year)) {
    return { created: 0, refreshed: 0, skipped: 1, total: student ? 1 : 0 };
  }

  const lineItems = tuitionLineItems(student, month, year);
  const expectedAmount = billExpectedAmount(lineItems);
  const existing = await Payment.findOne({
    student: student._id,
    year,
    $or: [
      { monthNumber },
      { month, monthNumber: { $exists: false } },
    ],
  });

  if (!existing) {
    const advanceBalance = await studentAdvanceBalance(student._id);
    const autoApplyAmount = Math.min(expectedAmount, Math.max(0, advanceBalance));
    await Payment.create({
      student: student._id,
      amount: autoApplyAmount,
      lineItems,
      transactions: autoApplyAmount > 0
        ? [advanceAppliedTransaction(autoApplyAmount, lineItems, month, year)]
        : [],
      expectedAmount,
      dueAmount: Math.max(0, expectedAmount - autoApplyAmount),
      month,
      monthNumber,
      year,
      paymentMethod: "cash",
      status: billStatus(autoApplyAmount, expectedAmount),
      receivedBy: undefined,
    });
    return { created: 1, refreshed: 0, skipped: 0, total: 1 };
  }

  const paidAmount = appliedTransactionTotal(existing.transactions?.length
    ? existing.transactions
    : existing.amount > 0
      ? [{ amount: existing.amount }]
      : []);
  const currentExpected = Number(existing.expectedAmount || expectedAmount);
  if (paidAmount >= currentExpected && currentExpected > 0) {
    return { created: 0, refreshed: 0, skipped: 0, total: 1 };
  }

  const advanceBalance = await studentAdvanceBalance(student._id);
  const autoApplyAmount = hasAdvanceApplied(existing.transactions)
    ? 0
    : Math.min(Math.max(0, expectedAmount - paidAmount), Math.max(0, advanceBalance));
  const transactions = [...(existing.transactions || [])];
  if (autoApplyAmount > 0) {
    transactions.push(advanceAppliedTransaction(autoApplyAmount, lineItems, month, year));
  }
  const nextPaidAmount = paidAmount + autoApplyAmount;
  await Payment.updateOne(
    { _id: existing._id },
    { $set: { ...billUpdatePayload(lineItems, nextPaidAmount, expectedAmount, month, monthNumber), transactions } }
  );
  return { created: 0, refreshed: 1, skipped: 0, total: 1 };
}

export async function ensureMonthlyBillsForMonth(monthNumber: number, year: number) {
  const month = monthNameFromNumber(monthNumber);
  if (!month) throw new Error("Invalid billing month");

  const students = await Student.find({ isActive: true })
    .select("selectedSubjects admissionDate")
    .lean();

  let created = 0;
  let refreshed = 0;
  let skipped = 0;

  for (const student of students) {
    if (!isStudentEligibleForBilling(student, monthNumber, year)) {
      skipped += 1;
      continue;
    }

    const lineItems = tuitionLineItems(student, month, year);
    const expectedAmount = billExpectedAmount(lineItems);
    const existing = await Payment.findOne({
      student: student._id,
      year,
      $or: [
        { monthNumber },
        { month, monthNumber: { $exists: false } },
      ],
    });

    if (!existing) {
      const advanceBalance = await studentAdvanceBalance(student._id);
      const autoApplyAmount = Math.min(expectedAmount, Math.max(0, advanceBalance));
      await Payment.create({
        student: student._id,
        amount: autoApplyAmount,
        lineItems,
        transactions: autoApplyAmount > 0
          ? [advanceAppliedTransaction(autoApplyAmount, lineItems, month, year)]
          : [],
        expectedAmount,
        dueAmount: Math.max(0, expectedAmount - autoApplyAmount),
        month,
        monthNumber,
        year,
        paymentMethod: "cash",
        status: billStatus(autoApplyAmount, expectedAmount),
        receivedBy: undefined,
      });
      created += 1;
      continue;
    }

    const paidAmount = appliedTransactionTotal(existing.transactions?.length
      ? existing.transactions
      : existing.amount > 0
        ? [{ amount: existing.amount }]
        : []);
    const currentExpected = Number(existing.expectedAmount || expectedAmount);
    if (paidAmount >= currentExpected && currentExpected > 0) {
      refreshed += 1;
      continue;
    }

    const advanceBalance = await studentAdvanceBalance(student._id);
    const autoApplyAmount = hasAdvanceApplied(existing.transactions)
      ? 0
      : Math.min(Math.max(0, expectedAmount - paidAmount), Math.max(0, advanceBalance));
    const transactions = [...(existing.transactions || [])];
    if (autoApplyAmount > 0) {
      transactions.push(advanceAppliedTransaction(autoApplyAmount, lineItems, month, year));
    }
    const nextPaidAmount = paidAmount + autoApplyAmount;

    await Payment.updateOne(
      { _id: existing._id },
      { $set: { ...billUpdatePayload(lineItems, nextPaidAmount, expectedAmount, month, monthNumber), transactions } }
    );
    refreshed += 1;
  }

  return { created, refreshed, skipped, total: students.length };
}

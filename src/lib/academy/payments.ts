import "server-only";

import type { ClientSession } from "mongoose";

import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/academy/constants";
import { currentMonthKey, formatReceiptNo } from "@/lib/academy/codes";
import { AcademyError, logActivity, type Actor } from "@/lib/academy/server";
import AcademyBatch from "@/models/academy/AcademyBatch";
import AcademyClass from "@/models/academy/AcademyClass";
import AcademyDue, { dueStatusFor } from "@/models/academy/AcademyDue";
import AcademyPayment from "@/models/academy/AcademyPayment";
import AcademyStudent from "@/models/academy/AcademyStudent";
import { nextSequence } from "@/models/academy/Counter";

const KIND_ORDER: Record<string, number> = { admission: 0, tuition: 1, exam: 2, other: 3 };

/**
 * Record a payment against the chosen dues and issue a receipt.
 * Money always clears the oldest bill first; whatever is left unpaid stays
 * on the bill and carries into the next receipt as "due".
 */
export async function recordPayment(
  input: {
    studentId: string;
    dueIds: string[];
    amount: number;
    method: PaymentMethod;
    transactionId?: string;
    paidAt?: Date;
    note?: string;
    /** One-time discount (Tk) taken off the selected bills with this payment only. */
    oneTimeDiscount?: number;
    oneTimeDiscountNote?: string;
  },
  actor: Actor,
  session: ClientSession
) {
  const amount = Math.round(input.amount);
  const oneTime = Math.max(0, Math.round(input.oneTimeDiscount ?? 0));
  const oneTimeNote = input.oneTimeDiscountNote?.trim() ?? "";
  if (oneTime > 0 && !oneTimeNote) throw new AcademyError("Write a reason for the one-time discount.");
  if (!Number.isFinite(amount) || amount <= 0) throw new AcademyError("Enter the amount received.");
  if (input.method !== "cash" && !input.transactionId?.trim()) {
    throw new AcademyError("Enter the transaction ID for online payments.");
  }

  const student = await AcademyStudent.findById(input.studentId).session(session).lean();
  if (!student) throw new AcademyError("That student no longer exists.");

  const dues = await AcademyDue.find({
    _id: { $in: input.dueIds },
    studentId: student._id,
    status: { $in: ["unpaid", "partial"] },
  }).session(session);
  if (dues.length === 0) throw new AcademyError("Choose at least one bill to pay.");

  dues.sort(
    (a, b) =>
      a.month.localeCompare(b.month) ||
      (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9) ||
      new Date(a.get("createdAt")).getTime() - new Date(b.get("createdAt")).getTime()
  );

  const openTotal = dues.reduce((sum, due) => sum + Math.max(0, due.amount - due.paid), 0);
  if (oneTime >= openTotal) {
    throw new AcademyError("The one-time discount must be less than the selected bills. To clear a bill completely, waive it instead.");
  }

  // 1. One-time discount: lower the selected bills (oldest first). Only these bills
  //    change; future months keep the student's normal fees.
  const oneTimeByDue = new Map<string, number>();
  const originalAmount = new Map(dues.map((due) => [String(due._id), due.amount]));
  let discountLeft = oneTime;
  for (const due of dues) {
    if (discountLeft <= 0) break;
    const open = Math.max(0, due.amount - due.paid);
    const cut = Math.min(open, discountLeft);
    if (cut <= 0) continue;
    discountLeft -= cut;
    due.amount -= cut;
    due.adjustment = (due.adjustment ?? 0) - cut;
    due.adjustmentNote = [due.adjustmentNote, `One-time discount: ${oneTimeNote}`].filter(Boolean).join(" · ");
    due.status = dueStatusFor(due.amount, due.paid);
    oneTimeByDue.set(String(due._id), cut);
  }

  const selectedTotal = openTotal - oneTime;
  if (amount > selectedTotal) {
    throw new AcademyError(`The amount is more than the selected bills (৳${selectedTotal.toLocaleString("en-IN")}). Select more months or lower the amount.`); // admin-language-allow
  }

  // 2. Money clears the oldest bill first.
  let remaining = amount;
  const allocations = [];
  let discountTotal = oneTime;
  for (const due of dues) {
    const cut = oneTimeByDue.get(String(due._id)) ?? 0;
    if (remaining <= 0 && cut === 0) continue;
    const open = Math.max(0, due.amount - due.paid);
    const take = Math.min(open, remaining);
    if (take <= 0 && cut === 0) continue;
    remaining -= take;
    due.paid += take;
    due.status = dueStatusFor(due.amount, due.paid);
    await due.save({ session });
    const discount = (due.lines ?? []).reduce((sum, line) => sum + (line.discount ?? 0), 0);
    discountTotal += discount;
    allocations.push({
      dueId: due._id,
      month: due.month,
      kind: due.kind,
      label: due.label,
      // The bill as it stood before this receipt's one-time discount.
      dueAmount: originalAmount.get(String(due._id)) ?? due.amount,
      discount,
      oneTimeDiscount: cut,
      amount: take,
      lines: (due.lines ?? []).map((line) => ({
        subjectName: line.subjectName,
        batchCode: line.batchCode,
        fee: line.fee,
        discount: line.discount,
        amount: line.amount,
      })),
    });
  }

  const month = currentMonthKey();
  const stillOwed = await AcademyDue.aggregate<{ total: number }>([
    { $match: { studentId: student._id, status: { $in: ["unpaid", "partial"] }, month: { $lte: month } } },
    { $group: { _id: null, total: { $sum: { $subtract: ["$amount", "$paid"] } } } },
  ]).session(session);

  const [cls, batch] = await Promise.all([
    AcademyClass.findById(student.classId).select("name").session(session).lean(),
    AcademyBatch.findById(student.homeBatchId).select("code").session(session).lean(),
  ]);

  // Each student's receipts are numbered 01, 02… after their ID.
  const serial = await nextSequence(`receipt:${student.studentId}`, session);
  const receiptNo = formatReceiptNo(student.studentId, serial);

  await AcademyPayment.create(
    [
      {
        receiptNo,
        studentId: student._id,
        amount,
        method: input.method,
        transactionId: input.transactionId?.trim() ?? "",
        paidAt: input.paidAt ?? new Date(),
        note: input.note?.trim() ?? "",
        allocations,
        snapshot: {
          studentName: student.name,
          studentCode: student.studentId,
          className: cls?.name ?? "",
          batchCode: batch?.code ?? "",
          version: student.version,
          guardianPhone: student.guardianPhone,
        },
        discountTotal,
        oneTimeDiscount: oneTime,
        oneTimeDiscountNote: oneTimeNote,
        dueAfter: Math.max(0, stillOwed[0]?.total ?? 0),
        receivedBy: actor,
      },
    ],
    { session }
  );

  await logActivity(
    {
      action: "payment.received",
      studentId: String(student._id),
      message: `Received ৳${amount.toLocaleString("en-IN")} (${PAYMENT_METHOD_LABELS[input.method]}) — receipt ${receiptNo}.`, // admin-language-allow
    },
    actor,
    session
  );
  if (oneTime > 0) {
    await logActivity(
      {
        action: "discount.one-time",
        studentId: String(student._id),
        message: `Gave a one-time discount of ৳${oneTime.toLocaleString("en-IN")} on receipt ${receiptNo}: ${oneTimeNote}.`, // admin-language-allow
      },
      actor,
      session
    );
  }

  return { receiptNo };
}

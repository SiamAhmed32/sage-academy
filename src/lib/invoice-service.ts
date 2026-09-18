import type { ClientSession } from "mongoose";

import Invoice from "@/models/Invoice";
import SubjectBatch from "@/models/SubjectBatch";
import Enrollment from "@/models/Enrollment";

export function currentBillingCycle() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Builds the student's first invoice from the sum of their newly-created
 * ACTIVE enrollments, minus a flat discount. This is what the admission
 * screen's "Fee Summary" mirrors client-side before submit — the server
 * always recomputes it from the actual enrolled slots, never trusts a
 * client-sent total.
 */
export async function generateInvoiceForEnrollments(
  studentId: string,
  enrollmentIds: string[],
  billingCycle: string,
  discount = 0,
  session?: ClientSession
) {
  const enrollments = await Enrollment.find({ _id: { $in: enrollmentIds } })
    .populate({ path: "subjectBatchId", populate: { path: "subjectId", select: "name" } })
    .session(session ?? null);

  const items = enrollments.map((enrollment) => {
    const slot = enrollment.subjectBatchId as unknown as {
      _id: unknown;
      monthlyFee: number;
      subjectId: { name: string };
    };
    return {
      enrollmentId: enrollment._id,
      subjectBatchId: slot._id,
      subjectName: slot.subjectId?.name ?? "Subject",
      fee: slot.monthlyFee,
      discount: 0,
      amount: slot.monthlyFee,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = Math.max(0, subtotal - discount);

  // Spread the flat discount across items proportionally so line items still
  // sum to the invoice total (purely presentational — billing logic only
  // cares about totalAmount).
  if (discount > 0 && subtotal > 0) {
    let remaining = discount;
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const share = isLast ? remaining : Math.round((item.amount / subtotal) * discount);
      item.discount = Math.min(item.amount, share);
      item.amount = item.amount - item.discount;
      remaining -= item.discount;
    });
  }

  const [invoice] = await Invoice.create(
    [
      {
        studentId,
        billingCycle,
        items,
        totalAmount,
        status: "UNPAID",
        paidAmount: 0,
      },
    ],
    { session }
  );

  return invoice;
}

/** Recomputes what a SubjectBatch slot's fee looks like — used by the admission UI's live fee preview. */
export async function getSubjectBatchFee(subjectBatchId: string) {
  const slot = await SubjectBatch.findById(subjectBatchId).select("monthlyFee");
  return slot?.monthlyFee ?? 0;
}

"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { DUE_KINDS, PAYMENT_METHODS, type DueKind, type Version } from "@/lib/academy/constants";
import { addMonths, currentMonthKey, isMonthKey, monthLabel } from "@/lib/academy/codes";
import { ensureMonthlyDues, ensureTuitionDues, tuitionLinesFor } from "@/lib/academy/dues";
import { feeForMonth, type FeeEntry } from "@/lib/academy/fees";
import { recordPayment } from "@/lib/academy/payments";
import { AcademyError, logActivity, requireObjectId, runAction, withTransaction } from "@/lib/academy/server";
import AcademyBatch from "@/models/academy/AcademyBatch";
import AcademyClass from "@/models/academy/AcademyClass";
import AcademyDue, { dueStatusFor } from "@/models/academy/AcademyDue";
import AcademyEnrollment from "@/models/academy/AcademyEnrollment";
import AcademyPayment from "@/models/academy/AcademyPayment";
import AcademyStudent from "@/models/academy/AcademyStudent";
import AcademySubject from "@/models/academy/AcademySubject";

function refresh() {
  revalidatePath("/admin", "layout");
}

export type PaymentContext = {
  student: {
    id: string;
    studentId: string;
    name: string;
    className: string;
    batchCode: string;
    version: Version;
    guardianPhone: string;
    status: string;
  };
  openDues: {
    id: string;
    month: string;
    kind: DueKind;
    label: string;
    amount: number;
    paid: number;
    lines: { subjectName: string; fee: number; discount: number; amount: number }[];
  }[];
  /** Preview of the next months' tuition, for paying in advance. */
  advance: { month: string; amount: number; exists: boolean }[];
};

/** Everything the collect-payment screen needs for one student. */
export async function paymentContextAction(studentId: string) {
  return runAction<PaymentContext>("staff", async () => {
    requireObjectId(studentId, "student");
    const month = currentMonthKey();
    // Make sure this month's bill exists before showing what is owed.
    await ensureTuitionDues(studentId, [month]);

    const student = await AcademyStudent.findById(studentId).lean();
    if (!student) throw new AcademyError("That student no longer exists.");
    const [cls, batch, dues, enrollments] = await Promise.all([
      AcademyClass.findById(student.classId).select("name").lean(),
      AcademyBatch.findById(student.homeBatchId).select("code").lean(),
      AcademyDue.find({ studentId, status: { $in: ["unpaid", "partial"] } }).sort({ month: 1, createdAt: 1 }).lean(),
      AcademyEnrollment.find({ studentId })
        .select("studentId subjectId batchId discountType discountValue startMonth endMonth")
        .lean(),
    ]);

    // Advance preview: next 6 months after this one.
    const subjects = await AcademySubject.find({ _id: { $in: enrollments.map((row) => row.subjectId) } })
      .select("name fees")
      .lean<{ _id: Types.ObjectId; name: string; fees: FeeEntry[] }[]>();
    const batches = await AcademyBatch.find({ _id: { $in: enrollments.map((row) => row.batchId) } }).select("code").lean();
    const subjectMap = new Map(subjects.map((subject) => [String(subject._id), subject]));
    const codeMap = new Map(batches.map((item) => [String(item._id), item.code]));
    const futureMonths = Array.from({ length: 6 }, (_, index) => addMonths(month, index + 1));
    const existingFuture = await AcademyDue.find({ studentId, kind: "tuition", month: { $in: futureMonths } })
      .select("month")
      .lean();
    const existing = new Set(existingFuture.map((due) => due.month));
    const advance =
      student.status === "active"
        ? futureMonths.map((future) => {
            const lines = tuitionLinesFor(
              enrollments as unknown as Parameters<typeof tuitionLinesFor>[0],
              subjectMap,
              codeMap,
              student.version as Version,
              future
            );
            return { month: future, amount: lines.reduce((sum, line) => sum + line.amount, 0), exists: existing.has(future) };
          }).filter((row) => row.amount > 0 && !row.exists)
        : [];

    return {
      ok: true,
      message: "",
      data: {
        student: {
          id: String(student._id),
          studentId: student.studentId,
          name: student.name,
          className: cls?.name ?? "",
          batchCode: batch?.code ?? "",
          version: student.version as Version,
          guardianPhone: student.guardianPhone,
          status: student.status,
        },
        openDues: dues.map((due) => ({
          id: String(due._id),
          month: due.month,
          kind: due.kind as DueKind,
          label: due.label,
          amount: due.amount,
          paid: due.paid,
          lines: (due.lines ?? []).map((line) => ({
            subjectName: line.subjectName,
            fee: line.fee,
            discount: line.discount,
            amount: line.amount,
          })),
        })),
        advance,
      },
    };
  });
}

const collectSchema = z.object({
  studentId: z.string(),
  oneTimeDiscount: z.coerce.number().int("Enter a whole taka discount.").min(0).optional().default(0),
  oneTimeDiscountNote: z.string().trim().max(120).optional().default(""),
  dueIds: z.array(z.string()).default([]),
  advanceMonths: z.array(z.string().refine(isMonthKey)).default([]),
  amount: z.coerce.number().int("Enter a whole taka amount.").min(1, "Enter the amount received."),
  method: z.enum(PAYMENT_METHODS),
  transactionId: z.string().trim().max(60).optional().default(""),
  paidAt: z.string().optional().default(""),
  note: z.string().trim().max(200).optional().default(""),
});

export async function collectPaymentAction(input: z.input<typeof collectSchema>) {
  return runAction<{ receiptNo: string }>("staff", async (actor) => {
    const data = collectSchema.parse(input);
    const studentId = requireObjectId(data.studentId, "student");
    const month = currentMonthKey();
    if (data.advanceMonths.some((item) => item <= month)) throw new AcademyError("Advance months must be after this month.");

    const result = await withTransaction(async (session) => {
      let dueIds = [...data.dueIds];
      if (data.advanceMonths.length > 0) {
        await ensureTuitionDues(studentId, data.advanceMonths, session);
        const advanceDues = await AcademyDue.find({
          studentId,
          kind: "tuition",
          month: { $in: data.advanceMonths },
          status: { $in: ["unpaid", "partial"] },
        })
          .select("_id")
          .session(session)
          .lean();
        dueIds = [...dueIds, ...advanceDues.map((due) => String(due._id))];
      }
      const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();
      return recordPayment(
        {
          studentId,
          dueIds,
          amount: data.amount,
          method: data.method,
          transactionId: data.transactionId,
          paidAt: Number.isNaN(paidAt.getTime()) ? new Date() : paidAt,
          note: data.note,
          oneTimeDiscount: data.oneTimeDiscount,
          oneTimeDiscountNote: data.oneTimeDiscountNote,
        },
        actor,
        session
      );
    });
    refresh();
    return { ok: true, message: `Payment saved. Receipt ${result.receiptNo} is ready.`, data: result };
  });
}

const chargeSchema = z.object({
  studentId: z.string(),
  kind: z.enum(DUE_KINDS).refine((kind) => kind !== "tuition", "Tuition is billed automatically."),
  label: z.string().trim().max(80).optional().default(""),
  amount: z.coerce.number().int().min(1, "Enter the amount."),
  month: z.string().refine(isMonthKey, "Choose a month."),
  note: z.string().trim().max(200).optional().default(""),
});

/** Add a one-off bill typed in by hand: admission, materials, exam or other. */
export async function addChargeAction(input: z.input<typeof chargeSchema>) {
  return runAction<{ id: string }>("staff", async (actor) => {
    const data = chargeSchema.parse(input);
    const studentId = requireObjectId(data.studentId, "student");
    const student = await AcademyStudent.findById(studentId).select("name").lean();
    if (!student) throw new AcademyError("That student no longer exists.");
    const label = data.label || { admission: "Admission fee", materials: "Materials fee", exam: "Exam fee", other: "Other fee", tuition: "Tuition" }[data.kind];
    const [due] = await AcademyDue.create([
      { studentId, month: data.month, kind: data.kind, label, amount: data.amount, note: data.note, createdBy: actor },
    ]);
    await logActivity(
      { action: "charge.added", studentId, message: `Added ${label} of ৳${data.amount.toLocaleString("en-IN")} for ${monthLabel(data.month)}.` }, // admin-language-allow
      actor
    );
    refresh();
    return { ok: true, message: `${label} added.`, data: { id: String(due._id) } };
  });
}

/** Cancel a bill nobody has paid anything towards (e.g. a waived month). */
export async function waiveDueAction(dueId: string, reason: string) {
  return runAction("staff", async (actor) => {
    requireObjectId(dueId, "bill");
    if (!reason.trim()) throw new AcademyError("Write why this bill is being cancelled.");
    const due = await AcademyDue.findById(dueId);
    if (!due) throw new AcademyError("That bill no longer exists.");
    if (due.paid > 0) throw new AcademyError("Part of this bill is paid. Void the receipt first if the payment was a mistake.");
    if (due.status === "void") throw new AcademyError("This bill is already cancelled.");
    due.status = "void";
    due.note = reason.trim();
    await due.save();
    await logActivity(
      { action: "due.waived", studentId: String(due.studentId), message: `Cancelled ${due.label || due.kind} for ${monthLabel(due.month)}: ${reason.trim()}` },
      actor
    );
    refresh();
    return { ok: true, message: "Bill cancelled." };
  });
}

/** Void a receipt: the money is taken off the bills it paid, and the receipt stays on record as void. */
export async function voidReceiptAction(receiptNo: string, reason: string) {
  return runAction("admin", async (actor) => {
    if (!reason.trim()) throw new AcademyError("Write why this receipt is being voided.");
    await withTransaction(async (session) => {
      const payment = await AcademyPayment.findOne({ receiptNo }).session(session);
      if (!payment) throw new AcademyError("That receipt does not exist.");
      if (payment.status === "void") throw new AcademyError("This receipt is already void.");
      const month = currentMonthKey();
      for (const allocation of payment.allocations) {
        const due = await AcademyDue.findById(allocation.dueId).session(session);
        if (!due) continue;
        due.paid = Math.max(0, due.paid - allocation.amount);
        // Undo this receipt's one-time discount: the bill goes back to its full amount.
        const cut = allocation.oneTimeDiscount ?? 0;
        if (cut > 0) {
          due.amount += cut;
          due.adjustment = (due.adjustment ?? 0) + cut;
        }
        // A future month billed only for this advance payment is removed, so it is
        // billed again at the fees in force when that month arrives.
        if (due.kind === "tuition" && due.month > month && due.paid === 0) {
          await due.deleteOne({ session });
          continue;
        }
        if (due.status !== "void") due.status = dueStatusFor(due.amount, due.paid);
        await due.save({ session });
      }
      payment.set({ status: "void", voidReason: reason.trim(), voidedBy: actor, voidedAt: new Date() });
      await payment.save({ session });
      await logActivity(
        {
          action: "payment.voided",
          studentId: String(payment.studentId),
          message: `Voided receipt ${receiptNo} (৳${payment.amount.toLocaleString("en-IN")}): ${reason.trim()}`, // admin-language-allow
        },
        actor,
        session
      );
    });
    refresh();
    return { ok: true, message: `Receipt ${receiptNo} voided. Its amount is owed again.` };
  });
}

export async function generateMonthDuesAction(month?: string) {
  return runAction<{ created: number }>("staff", async (actor) => {
    const target = month && isMonthKey(month) ? month : currentMonthKey();
    if (target > currentMonthKey()) throw new AcademyError("Future months are billed when a student pays in advance.");
    const result = await ensureMonthlyDues(target);
    if (result.created > 0) {
      await logActivity({ action: "dues.generated", message: `Created ${result.created} tuition bills for ${monthLabel(target)}.` }, actor);
    }
    refresh();
    return {
      ok: true,
      message: result.created > 0 ? `${result.created} bills created for ${monthLabel(target)}.` : `Every active student already has a ${monthLabel(target)} bill.`,
      data: { created: result.created },
    };
  });
}

/** Fee of one subject for a version (used by forms that preview a price). */
export async function subjectFeeAction(subjectId: string, version: Version) {
  return runAction<{ fee: number }>("staff", async () => {
    requireObjectId(subjectId, "subject");
    const subject = await AcademySubject.findById(subjectId).select("fees").lean<{ fees: FeeEntry[] }>();
    return { ok: true, message: "", data: { fee: feeForMonth(subject?.fees ?? [], version, currentMonthKey()) } };
  });
}

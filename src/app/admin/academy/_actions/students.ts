"use server";

import { revalidatePath } from "next/cache";
import { Types, type ClientSession } from "mongoose";
import { z } from "zod";

import {
  DISCOUNT_TYPES,
  PAYMENT_METHODS,
  STUDENT_GENDERS,
  batchGenderForStudent,
  type Version,
} from "@/lib/academy/constants";
import { addMonths, currentMonthKey, dhakaParts, formatStudentId, monthLabel } from "@/lib/academy/codes";
import { discountAmount, discountLabel, feeForMonth, type FeeEntry } from "@/lib/academy/fees";
import { recordPayment } from "@/lib/academy/payments";
import { batchStudentCounts, searchStudentsLite } from "@/lib/academy/queries";
import { studentClashes, type ClashSlot } from "@/lib/academy/routine";
import { AcademyError, logActivity, requireObjectId, runAction, withTransaction } from "@/lib/academy/server";
import { normalizeBangladeshPhone, isValidBdMobileNormalized } from "@/lib/bd-phone";
import AcademyBatch from "@/models/academy/AcademyBatch";
import AcademyClass from "@/models/academy/AcademyClass";
import AcademyDue, { dueStatusFor } from "@/models/academy/AcademyDue";
import AcademyEnrollment from "@/models/academy/AcademyEnrollment";
import AcademyStudent from "@/models/academy/AcademyStudent";
import AcademySubject from "@/models/academy/AcademySubject";
import { nextSequence } from "@/models/academy/Counter";
import Teacher from "@/models/Teacher";

function refresh() {
  revalidatePath("/admin", "layout");
}

const phone = (label: string, required: boolean) =>
  z
    .string()
    .trim()
    .transform((value) => (value ? normalizeBangladeshPhone(value) : ""))
    .refine((value) => (required ? isValidBdMobileNormalized(value) : !value || isValidBdMobileNormalized(value)), {
      message: `Enter a valid ${label} (11 digits, starting with 01).`,
    });

const detailsSchema = z.object({
  name: z.string().trim().min(2, "Enter the student's name.").max(80),
  nameBangla: z.string().trim().max(80).optional().default(""),
  gender: z.enum(STUDENT_GENDERS, { message: "Choose the student's gender." }),
  phone: phone("student phone", false),
  whatsapp: phone("WhatsApp number", false),
  guardianName: z.string().trim().min(2, "Enter the guardian's name.").max(80),
  guardianRelation: z.string().trim().max(30).optional().default(""),
  guardianPhone: phone("guardian phone", true),
  fatherName: z.string().trim().max(80).optional().default(""),
  motherName: z.string().trim().max(80).optional().default(""),
  schoolName: z.string().trim().max(120).optional().default(""),
  dateOfBirth: z.string().trim().optional().default(""),
  address: z.string().trim().max(300).optional().default(""),
  admissionDate: z.string().trim().optional().default(""),
  note: z.string().trim().max(500).optional().default(""),
});

export type StudentDetailsInput = z.input<typeof detailsSchema>;

const discountSchema = z.object({
  discountType: z.enum(DISCOUNT_TYPES).default("none"),
  discountValue: z.coerce.number().min(0, "A discount cannot be negative.").default(0),
  discountNote: z.string().trim().max(120).optional().default(""),
});

function checkDiscount(type: string, value: number, fee: number, subject: string) {
  if (type === "percent" && value > 100) throw new AcademyError(`${subject}: a discount cannot be more than 100%.`);
  if (type === "amount" && value > fee) {
    throw new AcademyError(`${subject}: the discount is more than the fee.`);
  }
}

function toDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

type LeanBatch = {
  _id: Types.ObjectId;
  code: string;
  classId: Types.ObjectId;
  classLevel: number;
  gender: string;
  version: Version;
  capacity: number;
  status: string;
  subjects: { subjectId: Types.ObjectId; teacherId: Types.ObjectId | null }[];
  routine: { subjectId: Types.ObjectId; day: ClashSlot["day"]; start: string; end: string; room: string }[];
};

async function assertSeat(batch: LeanBatch, studentId: string | null, session?: ClientSession) {
  if (studentId) {
    const already = await AcademyEnrollment.exists({ batchId: batch._id, studentId, status: "active" }).session(session ?? null);
    if (already) return;
  }
  const counts = await batchStudentCounts([batch._id]);
  const used = counts.get(String(batch._id)) ?? 0;
  if (used >= batch.capacity) {
    throw new AcademyError(`${batch.code} is full (${used}/${batch.capacity}). Raise the batch size on the batch page or choose another batch.`);
  }
}

/** The student's own weekly classes, optionally leaving one subject out. */
async function studentSlots(studentId: string, exceptSubjectId?: string): Promise<ClashSlot[]> {
  const enrollments = await AcademyEnrollment.find({ studentId, status: "active" }).lean();
  const rows = enrollments.filter((row) => String(row.subjectId) !== exceptSubjectId);
  const batches = await AcademyBatch.find({ _id: { $in: rows.map((row) => row.batchId) } }).lean<LeanBatch[]>();
  const subjects = await AcademySubject.find({ _id: { $in: rows.map((row) => row.subjectId) } }).select("name").lean();
  const nameOf = new Map(subjects.map((subject) => [String(subject._id), subject.name]));
  return rows.flatMap((row) => {
    const batch = batches.find((item) => String(item._id) === String(row.batchId));
    return (batch?.routine ?? [])
      .filter((slot) => String(slot.subjectId) === String(row.subjectId))
      .map((slot) => ({
        subjectId: String(slot.subjectId),
        day: slot.day,
        start: slot.start,
        end: slot.end,
        room: slot.room,
        subjectName: nameOf.get(String(row.subjectId)) ?? "Subject",
        batchCode: batch?.code ?? "",
        teacherId: null,
        teacherName: "",
      }));
  });
}

function slotsFor(batch: LeanBatch, subjectId: string, subjectName: string): ClashSlot[] {
  return batch.routine
    .filter((slot) => String(slot.subjectId) === subjectId)
    .map((slot) => ({
      subjectId,
      day: slot.day,
      start: slot.start,
      end: slot.end,
      room: slot.room,
      subjectName,
      batchCode: batch.code,
      teacherId: null,
      teacherName: "",
    }));
}

/** Add or replace one subject line on an unpaid tuition bill, then re-total it. */
async function upsertTuitionLine(
  studentId: string,
  month: string,
  line: { subjectId: Types.ObjectId; subjectName: string; batchCode: string; fee: number; discount: number },
  session?: ClientSession
) {
  const due = await AcademyDue.findOne({ studentId, month, kind: "tuition" }).session(session ?? null);
  if (!due || due.status === "void") return false;
  const lines = (due.lines ?? [])
    .filter((item) => String(item.subjectId) !== String(line.subjectId))
    .map((item) => ({
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      batchCode: item.batchCode,
      fee: item.fee,
      discount: item.discount,
      amount: item.amount,
    }));
  lines.push({ ...line, amount: Math.max(0, line.fee - line.discount) });
  const amount = Math.max(0, lines.reduce((sum, item) => sum + (item.amount ?? 0), 0) + (due.adjustment ?? 0));
  if (amount < due.paid) throw new AcademyError(`${monthLabel(month)} is already paid beyond the new amount, so that bill cannot change.`);
  due.set({ lines, amount, status: dueStatusFor(amount, due.paid) });
  await due.save({ session });
  return true;
}

// ───────────── Admission ─────────────

const admissionSchema = z.object({
  details: detailsSchema,
  batchId: z.string(),
  subjects: z
    .array(discountSchema.extend({ subjectId: z.string() }))
    .min(1, "Choose at least one subject."),
  firstMonthTuition: z.coerce.number().min(0, "First month's tuition cannot be negative."),
  admissionFee: z.coerce.number().min(0, "Admission fee cannot be negative.").default(0),
  materialsFee: z.coerce.number().min(0, "Materials fee cannot be negative.").default(0),
  admissionRequestId: z.string().optional().default(""),
  payment: z
    .object({
      amount: z.coerce.number().min(0),
      method: z.enum(PAYMENT_METHODS),
      transactionId: z.string().trim().optional().default(""),
    })
    .nullable()
    .default(null),
});

export type AdmissionInput = z.input<typeof admissionSchema>;

export async function admitStudentAction(input: AdmissionInput) {
  return runAction<{ id: string; studentId: string; receiptNo: string | null }>("staff", async (actor) => {
    const data = admissionSchema.parse(input);
    requireObjectId(data.batchId, "batch");
    const batch = await AcademyBatch.findById(data.batchId).lean<LeanBatch>();
    if (!batch || batch.status !== "active") throw new AcademyError("Choose an active batch.");
    if (batch.gender !== batchGenderForStudent(data.details.gender)) {
      throw new AcademyError(`${batch.code} is a ${batch.gender} batch. Choose a batch that matches the student.`);
    }

    const offered = new Set(batch.subjects.map((item) => String(item.subjectId)));
    const chosenIds = [...new Set(data.subjects.map((item) => item.subjectId))];
    if (chosenIds.some((id) => !offered.has(id))) throw new AcademyError("Every subject must be taught in the chosen batch.");
    const subjects = await AcademySubject.find({ _id: { $in: chosenIds } }).lean<{ _id: Types.ObjectId; name: string; fees: FeeEntry[] }[]>();
    const month = currentMonthKey();

    for (const choice of data.subjects) {
      const subject = subjects.find((item) => String(item._id) === choice.subjectId);
      checkDiscount(choice.discountType, choice.discountValue, feeForMonth(subject?.fees ?? [], batch.version, month), subject?.name ?? "Subject");
    }

    const duplicate = await AcademyStudent.findOne({
      status: "active",
      guardianPhone: data.details.guardianPhone,
      name: new RegExp(`^${data.details.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    })
      .select("studentId")
      .lean();
    if (duplicate) {
      throw new AcademyError(`${data.details.name} with this guardian phone is already enrolled as ${duplicate.studentId}.`);
    }

    const payAmount = Math.round(data.payment?.amount ?? 0);
    if (payAmount > Math.round(data.admissionFee + data.materialsFee + data.firstMonthTuition)) {
      throw new AcademyError("The amount received is more than the admission fee, materials fee and first month's tuition together.");
    }

    const result = await withTransaction(async (session) => {
      await assertSeat(batch, null, session);
      const { year } = dhakaParts();

      // Numbered per admission year and class: 2605001, 2605002, 2609001…
      const serial = await nextSequence(`student:${year}:${batch.classLevel}`, session);
      const code = formatStudentId(year, batch.classLevel, serial);

      const [student] = await AcademyStudent.create(
        [
          {
            ...data.details,
            dateOfBirth: toDate(data.details.dateOfBirth),
            admissionDate: toDate(data.details.admissionDate) ?? new Date(),
            studentId: code,
            admissionYear: year,
            serial,
            version: batch.version,
            classId: batch.classId,
            homeBatchId: batch._id,
            admissionRequestId: Types.ObjectId.isValid(data.admissionRequestId) ? data.admissionRequestId : null,
            createdBy: actor,
          },
        ],
        { session }
      );

      const lines = [];
      for (const choice of data.subjects) {
        const subject = subjects.find((item) => String(item._id) === choice.subjectId)!;
        await AcademyEnrollment.create(
          [
            {
              studentId: student._id,
              subjectId: subject._id,
              batchId: batch._id,
              discountType: choice.discountType,
              discountValue: choice.discountType === "none" ? 0 : choice.discountValue,
              discountNote: choice.discountNote,
              startMonth: month,
              history: [{ action: "enrolled", toBatchId: batch._id, by: actor }],
            },
          ],
          { session }
        );
        const fee = feeForMonth(subject.fees, batch.version, month);
        const discount = discountAmount(fee, choice.discountType, choice.discountValue);
        lines.push({ subjectId: subject._id, subjectName: subject.name, batchCode: batch.code, fee, discount, amount: fee - discount });
        if (discount > 0) {
          await logActivity(
            {
              action: "discount.given",
              studentId: String(student._id),
              subjectId: String(subject._id),
              message: `Gave ${discountLabel(choice.discountType, choice.discountValue)} discount on ${subject.name}${choice.discountNote ? ` (${choice.discountNote})` : ""}.`,
            },
            actor,
            session
          );
        }
      }

      const computed = lines.reduce((sum, line) => sum + line.amount, 0);
      const firstMonth = Math.round(data.firstMonthTuition);
      const dueIds: string[] = [];

      if (data.admissionFee > 0) {
        const [admission] = await AcademyDue.create(
          [{ studentId: student._id, month, kind: "admission", label: "Admission fee", amount: Math.round(data.admissionFee), createdBy: actor }],
          { session }
        );
        dueIds.push(String(admission._id));
      }

      if (data.materialsFee > 0) {
        const [materials] = await AcademyDue.create(
          [{ studentId: student._id, month, kind: "materials", label: "Materials fee", amount: Math.round(data.materialsFee), createdBy: actor }],
          { session }
        );
        dueIds.push(String(materials._id));
      }

      // Always create this month's tuition bill so the monthly run never re-bills the full amount.
      const [tuition] = await AcademyDue.create(
        [
          {
            studentId: student._id,
            month,
            kind: "tuition",
            label: "Monthly tuition",
            lines,
            adjustment: firstMonth - computed,
            adjustmentNote: firstMonth !== computed ? "First month set at admission" : "",
            amount: firstMonth,
            paid: 0,
            status: firstMonth > 0 ? "unpaid" : "paid",
            createdBy: actor,
          },
        ],
        { session }
      );
      if (firstMonth > 0) dueIds.push(String(tuition._id));

      await logActivity(
        { action: "student.admitted", studentId: String(student._id), batchId: String(batch._id), message: `Admitted ${student.name} as ${code} into ${batch.code}.` },
        actor,
        session
      );

      let receiptNo: string | null = null;
      if (data.payment && payAmount > 0) {
        const receipt = await recordPayment(
          {
            studentId: String(student._id),
            dueIds,
            amount: payAmount,
            method: data.payment.method,
            transactionId: data.payment.transactionId,
          },
          actor,
          session
        );
        receiptNo = receipt.receiptNo;
      }

      return { id: String(student._id), studentId: code, receiptNo };
    });

    refresh();
    return { ok: true, message: `${data.details.name} admitted as ${result.studentId}.`, data: result };
  });
}

// ───────────── Profile edits ─────────────

export async function updateStudentDetailsAction(id: string, input: StudentDetailsInput) {
  return runAction("staff", async (actor) => {
    requireObjectId(id, "student");
    const data = detailsSchema.parse(input);
    const student = await AcademyStudent.findById(id);
    if (!student) throw new AcademyError("That student no longer exists.");
    if (student.gender !== data.gender) {
      const batch = await AcademyBatch.findById(student.homeBatchId).select("gender").lean();
      if (batch && batch.gender !== batchGenderForStudent(data.gender)) {
        throw new AcademyError("Gender must match the student's batch. Transfer the student to the right batch first.");
      }
    }
    student.set({
      ...data,
      dateOfBirth: toDate(data.dateOfBirth),
      admissionDate: toDate(data.admissionDate) ?? student.admissionDate,
    });
    await student.save();
    await logActivity({ action: "student.updated", studentId: id, message: "Updated student details." }, actor);
    refresh();
    return { ok: true, message: "Details saved." };
  });
}

export async function setStudentStatusAction(id: string, status: "active" | "inactive", note = "") {
  return runAction("staff", async (actor) => {
    requireObjectId(id, "student");
    const month = currentMonthKey();
    await withTransaction(async (session) => {
      const student = await AcademyStudent.findById(id).session(session);
      if (!student) throw new AcademyError("That student no longer exists.");
      student.status = status;
      await student.save({ session });
      if (status === "inactive") {
        // Leaving frees their seats; billing stops after this month.
        await AcademyEnrollment.updateMany(
          { studentId: id, status: "active" },
          { $set: { status: "dropped", endMonth: month }, $push: { history: { action: "dropped", note: note || "Student left", by: actor, at: new Date() } } },
          { session }
        );
      }
      await logActivity(
        { action: `student.${status}`, studentId: id, message: status === "inactive" ? `Marked as left${note ? `: ${note}` : ""}. Billing stops after ${monthLabel(month)}.` : "Marked as active again." },
        actor,
        session
      );
    });
    refresh();
    return {
      ok: true,
      message: status === "inactive" ? `Marked as left. No bills after ${monthLabel(month)}.` : "Student is active again. Add their subjects to start billing.",
    };
  });
}

// ───────────── Subjects on a student ─────────────

const addSubjectSchema = discountSchema.extend({
  studentId: z.string(),
  subjectId: z.string(),
  batchId: z.string(),
  billFrom: z.enum(["this", "next"]).default("next"),
});

export async function addStudentSubjectAction(input: z.input<typeof addSubjectSchema>) {
  return runAction("staff", async (actor) => {
    const data = addSubjectSchema.parse(input);
    const [studentId, subjectId, batchId] = [
      requireObjectId(data.studentId, "student"),
      requireObjectId(data.subjectId, "subject"),
      requireObjectId(data.batchId, "batch"),
    ];
    const student = await AcademyStudent.findById(studentId).lean();
    if (!student || student.status !== "active") throw new AcademyError("Only active students can take new subjects.");
    const batch = await AcademyBatch.findById(batchId).lean<LeanBatch>();
    if (!batch || batch.status !== "active") throw new AcademyError("Choose an active batch.");
    if (String(batch.classId) !== String(student.classId) || batch.version !== student.version || batch.gender !== batchGenderForStudent(student.gender as "male" | "female")) {
      throw new AcademyError("The batch must be the same class, version and gender as the student.");
    }
    if (!batch.subjects.some((item) => String(item.subjectId) === subjectId)) throw new AcademyError(`${batch.code} does not teach that subject.`);
    const already = await AcademyEnrollment.exists({ studentId, subjectId, status: "active" });
    if (already) throw new AcademyError("The student already takes this subject.");

    const subject = await AcademySubject.findById(subjectId).lean<{ _id: Types.ObjectId; name: string; fees: FeeEntry[] }>();
    if (!subject) throw new AcademyError("That subject no longer exists.");
    const month = currentMonthKey();
    const startMonth = data.billFrom === "this" ? month : addMonths(month, 1);
    const fee = feeForMonth(subject.fees, student.version as Version, startMonth);
    checkDiscount(data.discountType, data.discountValue, fee, subject.name);

    const clashes = studentClashes(slotsFor(batch, subjectId, subject.name), await studentSlots(studentId));
    if (clashes.length > 0) throw new AcademyError(`Timetable clash:\n• ${clashes.join("\n• ")}`);

    let addedToBill = false;
    await withTransaction(async (session) => {
      await assertSeat(batch, studentId, session);
      await AcademyEnrollment.create(
        [
          {
            studentId,
            subjectId,
            batchId,
            discountType: data.discountType,
            discountValue: data.discountType === "none" ? 0 : data.discountValue,
            discountNote: data.discountNote,
            startMonth,
            history: [{ action: "enrolled", toBatchId: batch._id, by: actor }],
          },
        ],
        { session }
      );
      if (data.billFrom === "this") {
        const discount = discountAmount(fee, data.discountType, data.discountValue);
        addedToBill = await upsertTuitionLine(studentId, month, { subjectId: subject._id, subjectName: subject.name, batchCode: batch.code, fee, discount }, session);
      }
      await logActivity(
        {
          action: "subject.added",
          studentId,
          subjectId,
          batchId,
          message: `Added ${subject.name} in ${batch.code}, billed from ${monthLabel(startMonth)}${data.discountType !== "none" && data.discountValue > 0 ? ` with ${discountLabel(data.discountType, data.discountValue)} discount` : ""}.`,
        },
        actor,
        session
      );
    });
    refresh();
    return {
      ok: true,
      message: `${subject.name} added.${data.billFrom === "this" ? (addedToBill ? " This month's bill was updated." : " It will appear on this month's bill.") : ` Billing starts ${monthLabel(startMonth)}.`}`,
    };
  });
}

export async function dropStudentSubjectAction(enrollmentId: string, note = "") {
  return runAction("staff", async (actor) => {
    requireObjectId(enrollmentId, "subject");
    const enrollment = await AcademyEnrollment.findById(enrollmentId);
    if (!enrollment || enrollment.status !== "active") throw new AcademyError("This subject is not active for the student.");
    const month = currentMonthKey();
    const subject = await AcademySubject.findById(enrollment.subjectId).select("name").lean();
    // A subject that has not started billing yet simply ends before it starts.
    enrollment.set({
      status: "dropped",
      endMonth: enrollment.startMonth > month ? addMonths(enrollment.startMonth, -1) : month,
    });
    enrollment.history.push({ action: "dropped", note, by: actor, at: new Date() });
    await enrollment.save();
    await logActivity(
      { action: "subject.dropped", studentId: String(enrollment.studentId), subjectId: String(enrollment.subjectId), message: `Dropped ${subject?.name ?? "a subject"}${note ? `: ${note}` : ""}. Billing stops after ${monthLabel(month)}.` },
      actor
    );
    refresh();
    return { ok: true, message: `${subject?.name ?? "Subject"} dropped. It is not billed after ${monthLabel(month)}.` };
  });
}

const changeDiscountSchema = discountSchema.extend({
  enrollmentId: z.string(),
  applyThisMonth: z.boolean().default(false),
});

export async function changeDiscountAction(input: z.input<typeof changeDiscountSchema>) {
  return runAction("staff", async (actor) => {
    const data = changeDiscountSchema.parse(input);
    requireObjectId(data.enrollmentId, "subject");
    const enrollment = await AcademyEnrollment.findById(data.enrollmentId);
    if (!enrollment || enrollment.status !== "active") throw new AcademyError("This subject is not active for the student.");
    const [student, subject, batch] = await Promise.all([
      AcademyStudent.findById(enrollment.studentId).select("version").lean(),
      AcademySubject.findById(enrollment.subjectId).lean<{ _id: Types.ObjectId; name: string; fees: FeeEntry[] }>(),
      AcademyBatch.findById(enrollment.batchId).select("code").lean(),
    ]);
    if (!student || !subject) throw new AcademyError("That record no longer exists.");
    const month = currentMonthKey();
    const fee = feeForMonth(subject.fees, student.version as Version, month);
    checkDiscount(data.discountType, data.discountValue, fee, subject.name);

    const value = data.discountType === "none" ? 0 : data.discountValue;
    let updatedBill = false;
    await withTransaction(async (session) => {
      enrollment.set({ discountType: data.discountType, discountValue: value, discountNote: data.discountNote });
      enrollment.history.push({ action: "discount", note: `${discountLabel(data.discountType, value)}${data.discountNote ? ` — ${data.discountNote}` : ""}`, by: actor, at: new Date() });
      await enrollment.save({ session });
      if (data.applyThisMonth && enrollment.startMonth <= month) {
        updatedBill = await upsertTuitionLine(
          String(enrollment.studentId),
          month,
          { subjectId: subject._id, subjectName: subject.name, batchCode: batch?.code ?? "", fee, discount: discountAmount(fee, data.discountType, value) },
          session
        );
      }
      await logActivity(
        {
          action: "discount.changed",
          studentId: String(enrollment.studentId),
          subjectId: String(subject._id),
          message: `Set ${subject.name} discount to ${discountLabel(data.discountType, value)}${data.discountNote ? ` (${data.discountNote})` : ""}${updatedBill ? `, including ${monthLabel(month)}` : ""}.`,
        },
        actor,
        session
      );
    });
    refresh();
    return {
      ok: true,
      message: updatedBill ? `Discount saved and ${monthLabel(month)}'s bill updated.` : `Discount saved. It applies from ${monthLabel(addMonths(month, 1))}'s bill.`,
    };
  });
}

// ───────────── Subject transfer ─────────────

export async function transferOptionsAction(enrollmentId: string) {
  return runAction<{ id: string; code: string; students: number; capacity: number; full: boolean; clashes: string[]; teacher: string; slots: number }[]>(
    "staff",
    async () => {
      requireObjectId(enrollmentId, "subject");
      const enrollment = await AcademyEnrollment.findById(enrollmentId).lean();
      if (!enrollment || enrollment.status !== "active") throw new AcademyError("This subject is not active for the student.");
      const student = await AcademyStudent.findById(enrollment.studentId).lean();
      if (!student) throw new AcademyError("That student no longer exists.");
      const subject = await AcademySubject.findById(enrollment.subjectId).select("name").lean();
      const batches = await AcademyBatch.find({
        _id: { $ne: enrollment.batchId },
        status: "active",
        classId: student.classId,
        version: student.version,
        gender: batchGenderForStudent(student.gender as "male" | "female"),
        "subjects.subjectId": enrollment.subjectId,
      }).lean<LeanBatch[]>();
      const counts = await batchStudentCounts(batches.map((batch) => batch._id));
      const inBatches = new Set(
        (await AcademyEnrollment.find({ studentId: student._id, status: "active" }).select("batchId").lean()).map((row) => String(row.batchId))
      );
      const mine = await studentSlots(String(student._id), String(enrollment.subjectId));
      const teacherIds = batches.map((batch) => batch.subjects.find((item) => String(item.subjectId) === String(enrollment.subjectId))?.teacherId).filter(Boolean);
      const teachers = await Teacher.find({ _id: { $in: teacherIds } }).select("name").lean<{ _id: unknown; name: string }[]>();
      return {
        ok: true,
        message: "",
        data: batches.map((batch) => {
          const students = counts.get(String(batch._id)) ?? 0;
          const teacherId = batch.subjects.find((item) => String(item.subjectId) === String(enrollment.subjectId))?.teacherId;
          const incoming = slotsFor(batch, String(enrollment.subjectId), subject?.name ?? "Subject");
          return {
            id: String(batch._id),
            code: batch.code,
            students,
            capacity: batch.capacity,
            full: students >= batch.capacity && !inBatches.has(String(batch._id)),
            clashes: studentClashes(incoming, mine),
            teacher: teachers.find((teacher) => String(teacher._id) === String(teacherId))?.name ?? "",
            slots: incoming.length,
          };
        }),
      };
    }
  );
}

export async function transferSubjectAction(input: { enrollmentId: string; toBatchId: string; note?: string }) {
  return runAction("staff", async (actor) => {
    const enrollmentId = requireObjectId(input.enrollmentId, "subject");
    const toBatchId = requireObjectId(input.toBatchId, "batch");
    const enrollment = await AcademyEnrollment.findById(enrollmentId);
    if (!enrollment || enrollment.status !== "active") throw new AcademyError("This subject is not active for the student.");
    if (String(enrollment.batchId) === toBatchId) throw new AcademyError("The student is already in that batch for this subject.");
    const student = await AcademyStudent.findById(enrollment.studentId);
    if (!student) throw new AcademyError("That student no longer exists.");
    const [target, source, subject] = await Promise.all([
      AcademyBatch.findById(toBatchId).lean<LeanBatch>(),
      AcademyBatch.findById(enrollment.batchId).select("code").lean(),
      AcademySubject.findById(enrollment.subjectId).select("name").lean(),
    ]);
    if (!target || target.status !== "active") throw new AcademyError("Choose an active batch.");
    if (
      String(target.classId) !== String(student.classId) ||
      target.version !== student.version ||
      target.gender !== batchGenderForStudent(student.gender as "male" | "female")
    ) {
      throw new AcademyError("Subjects can only move to a batch of the same class, version and gender.");
    }
    if (!target.subjects.some((item) => String(item.subjectId) === String(enrollment.subjectId))) {
      throw new AcademyError(`${target.code} does not teach ${subject?.name ?? "this subject"}.`);
    }
    const clashes = studentClashes(
      slotsFor(target, String(enrollment.subjectId), subject?.name ?? "Subject"),
      await studentSlots(String(student._id), String(enrollment.subjectId))
    );
    if (clashes.length > 0) throw new AcademyError(`Timetable clash:\n• ${clashes.join("\n• ")}`);

    await withTransaction(async (session) => {
      await assertSeat(target, String(student._id), session);
      const fromBatchId = enrollment.batchId;
      enrollment.batchId = target._id;
      enrollment.history.push({ action: "transferred", fromBatchId, toBatchId: target._id, note: input.note ?? "", by: actor, at: new Date() });
      await enrollment.save({ session });

      // If nothing is left in the home batch, the new batch becomes home.
      if (String(student.homeBatchId) === String(fromBatchId)) {
        const left = await AcademyEnrollment.exists({ studentId: student._id, batchId: fromBatchId, status: "active" }).session(session);
        if (!left) {
          student.homeBatchId = target._id;
          await student.save({ session });
        }
      }
      await logActivity(
        {
          action: "subject.transferred",
          studentId: String(student._id),
          subjectId: String(enrollment.subjectId),
          batchId: String(target._id),
          message: `Moved ${subject?.name ?? "a subject"} from ${source?.code ?? "?"} to ${target.code}${input.note ? `: ${input.note}` : ""}.`,
        },
        actor,
        session
      );
    });
    refresh();
    return { ok: true, message: `${subject?.name ?? "Subject"} moved to ${target.code}. Fees stay the same.` };
  });
}

// ───────────── Search ─────────────

export async function searchStudentsAction(q: string) {
  return runAction<Awaited<ReturnType<typeof searchStudentsLite>>>("staff", async () => {
    return { ok: true, message: "", data: await searchStudentsLite(q) };
  });
}

export async function studentEnrollmentsAction(studentId: string) {
  return runAction<{ enrollmentId: string; subject: string; batchCode: string; batchId: string }[]>("staff", async () => {
    requireObjectId(studentId, "student");
    const rows = await AcademyEnrollment.find({ studentId, status: "active" }).lean();
    const [subjects, batches] = await Promise.all([
      AcademySubject.find({ _id: { $in: rows.map((row) => row.subjectId) } }).select("name").lean(),
      AcademyBatch.find({ _id: { $in: rows.map((row) => row.batchId) } }).select("code").lean(),
    ]);
    return {
      ok: true,
      message: "",
      data: rows
        .map((row) => ({
          enrollmentId: String(row._id),
          subject: subjects.find((subject) => String(subject._id) === String(row.subjectId))?.name ?? "Subject",
          batchCode: batches.find((batch) => String(batch._id) === String(row.batchId))?.code ?? "",
          batchId: String(row.batchId),
        }))
        .sort((a, b) => a.subject.localeCompare(b.subject)),
    };
  });
}



// ───────────── Archive & delete (soft) ─────────────
// Only a student who has left and owes nothing can be archived. A deleted
// student stays in the database (their receipts remain) but leaves the app.

export async function setStudentArchivedAction(id: string, archived: boolean) {
  return runAction("admin", async (actor) => {
    requireObjectId(id, "student");
    const student = await AcademyStudent.findById(id).lean();
    if (!student) throw new AcademyError("That student no longer exists.");
    if (archived) {
      if (student.status !== "inactive") throw new AcademyError("Mark the student as left first. Only students who have left can be archived.");
      const owing = await AcademyDue.countDocuments({ studentId: id, status: { $in: ["unpaid", "partial"] } });
      if (owing) throw new AcademyError(`This student still has ${owing} unpaid bill${owing === 1 ? "" : "s"}. Collect or waive them first.`);
    } else {
      const [cls, batch] = await Promise.all([
        AcademyClass.findById(student.classId).select("isArchived name").lean(),
        AcademyBatch.findById(student.homeBatchId).select("_id").lean(),
      ]);
      if (!cls || !batch) throw new AcademyError("This student's class or batch was deleted, so they cannot be restored.");
      if (cls.isArchived) throw new AcademyError(`${cls.name} is archived. Restore the class first.`);
    }
    await AcademyStudent.updateOne({ _id: id }, { $set: { isArchived: archived } });
    await logActivity({ action: archived ? "student.archived" : "student.restored", studentId: id, message: archived ? "Archived the student." : "Restored the student from the archive." }, actor);
    refresh();
    return { ok: true, message: archived ? `${student.name} archived.` : `${student.name} restored.` };
  });
}

export async function deleteStudentAction(id: string) {
  return runAction("admin", async (actor) => {
    requireObjectId(id, "student");
    const student = await AcademyStudent.findById(id).lean();
    if (!student) throw new AcademyError("That student no longer exists.");
    if (!student.isArchived) throw new AcademyError("Archive the student first. Only archived students can be deleted.");
    await AcademyStudent.updateOne({ _id: id }, { $set: { deletedAt: new Date(), deletedBy: { id: actor.id, name: actor.name } } });
    await logActivity({ action: "student.deleted", studentId: id, message: `Deleted ${student.name} (${student.studentId}).` }, actor);
    refresh();
    return { ok: true, message: `${student.name} deleted.` };
  });
}

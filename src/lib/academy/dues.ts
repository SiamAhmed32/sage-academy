import "server-only";

import { Types, type ClientSession } from "mongoose";

import type { DiscountType, Version } from "@/lib/academy/constants";
import { currentMonthKey } from "@/lib/academy/codes";
import { discountAmount, feeForMonth, type FeeEntry } from "@/lib/academy/fees";
import AcademyBatch from "@/models/academy/AcademyBatch";
import AcademyDue from "@/models/academy/AcademyDue";
import AcademyEnrollment from "@/models/academy/AcademyEnrollment";
import AcademyStudent from "@/models/academy/AcademyStudent";
import AcademySubject from "@/models/academy/AcademySubject";

type LeanEnrollment = {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  batchId: Types.ObjectId;
  discountType: DiscountType;
  discountValue: number;
  startMonth: string;
  endMonth: string | null;
};

type LeanSubject = { _id: Types.ObjectId; name: string; fees: FeeEntry[] };

export type TuitionLine = {
  subjectId: Types.ObjectId;
  subjectName: string;
  batchCode: string;
  fee: number;
  discount: number;
  amount: number;
};

function coversMonth(enrollment: Pick<LeanEnrollment, "startMonth" | "endMonth">, month: string) {
  return enrollment.startMonth <= month && (!enrollment.endMonth || enrollment.endMonth >= month);
}

/** Tuition lines for one student and month, from fees in force that month. */
export function tuitionLinesFor(
  enrollments: LeanEnrollment[],
  subjects: Map<string, LeanSubject>,
  batchCodes: Map<string, string>,
  version: Version,
  month: string
): TuitionLine[] {
  return enrollments
    .filter((enrollment) => coversMonth(enrollment, month))
    .map((enrollment) => {
      const subject = subjects.get(String(enrollment.subjectId));
      const fee = subject ? feeForMonth(subject.fees, version, month) : 0;
      const discount = discountAmount(fee, enrollment.discountType, enrollment.discountValue);
      return {
        subjectId: enrollment.subjectId,
        subjectName: subject?.name ?? "Subject",
        batchCode: batchCodes.get(String(enrollment.batchId)) ?? "",
        fee,
        discount,
        amount: Math.max(0, fee - discount),
      };
    })
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
}

async function lookupMaps(enrollments: LeanEnrollment[], session?: ClientSession) {
  const subjectIds = [...new Set(enrollments.map((row) => String(row.subjectId)))];
  const batchIds = [...new Set(enrollments.map((row) => String(row.batchId)))];
  const [subjects, batches] = await Promise.all([
    AcademySubject.find({ _id: { $in: subjectIds } })
      .select("name fees")
      .session(session ?? null)
      .lean<LeanSubject[]>(),
    AcademyBatch.find({ _id: { $in: batchIds } })
      .select("code")
      .session(session ?? null)
      .lean<{ _id: Types.ObjectId; code: string }[]>(),
  ]);
  return {
    subjects: new Map(subjects.map((subject) => [String(subject._id), subject])),
    batchCodes: new Map(batches.map((batch) => [String(batch._id), batch.code])),
  };
}

/**
 * Create the tuition due for each given month where one does not exist yet.
 * Existing dues are never changed, so fee and discount edits only reach
 * months billed after the edit.
 */
export async function ensureTuitionDues(
  studentId: string,
  months: string[],
  session?: ClientSession
) {
  const student = await AcademyStudent.findById(studentId)
    .select("version status")
    .session(session ?? null)
    .lean<{ _id: Types.ObjectId; version: Version; status: string }>();
  if (!student || student.status !== "active" || months.length === 0) return 0;

  const enrollments = await AcademyEnrollment.find({ studentId })
    .select("studentId subjectId batchId discountType discountValue startMonth endMonth")
    .session(session ?? null)
    .lean<LeanEnrollment[]>();
  const existing = await AcademyDue.find({ studentId, kind: "tuition", month: { $in: months } })
    .select("month")
    .session(session ?? null)
    .lean<{ month: string }[]>();
  const have = new Set(existing.map((due) => due.month));
  const { subjects, batchCodes } = await lookupMaps(enrollments, session);

  const docs = months
    .filter((month) => !have.has(month))
    .map((month) => {
      const lines = tuitionLinesFor(enrollments, subjects, batchCodes, student.version, month);
      const amount = lines.reduce((sum, line) => sum + line.amount, 0);
      return { studentId: student._id, month, kind: "tuition", label: "Monthly tuition", lines, amount, paid: 0, status: amount > 0 ? "unpaid" : "paid" };
    })
    .filter((doc) => doc.lines.length > 0);

  if (docs.length === 0) return 0;
  await AcademyDue.insertMany(docs, { session, ordered: false }).catch((error: { code?: number }) => {
    if (error?.code !== 11000) throw error; // another request created it first
  });
  return docs.length;
}

/** Create this month's tuition dues for every active student (idempotent). */
export async function ensureMonthlyDues(month = currentMonthKey()) {
  const students = await AcademyStudent.find({ status: "active" })
    .select("version")
    .lean<{ _id: Types.ObjectId; version: Version }[]>();
  if (students.length === 0) return { month, created: 0 };

  const [enrollments, existing] = await Promise.all([
    AcademyEnrollment.find({
      studentId: { $in: students.map((student) => student._id) },
      startMonth: { $lte: month },
      $or: [{ endMonth: null }, { endMonth: { $gte: month } }],
    })
      .select("studentId subjectId batchId discountType discountValue startMonth endMonth")
      .lean<LeanEnrollment[]>(),
    AcademyDue.find({ kind: "tuition", month }).select("studentId").lean<{ studentId: Types.ObjectId }[]>(),
  ]);

  const have = new Set(existing.map((due) => String(due.studentId)));
  const byStudent = new Map<string, LeanEnrollment[]>();
  for (const enrollment of enrollments) {
    const key = String(enrollment.studentId);
    byStudent.set(key, [...(byStudent.get(key) ?? []), enrollment]);
  }
  const { subjects, batchCodes } = await lookupMaps(enrollments);

  const docs = students
    .filter((student) => !have.has(String(student._id)) && byStudent.has(String(student._id)))
    .map((student) => {
      const lines = tuitionLinesFor(byStudent.get(String(student._id)) ?? [], subjects, batchCodes, student.version, month);
      const amount = lines.reduce((sum, line) => sum + line.amount, 0);
      return { studentId: student._id, month, kind: "tuition", label: "Monthly tuition", lines, amount, paid: 0, status: amount > 0 ? "unpaid" : "paid" };
    })
    .filter((doc) => doc.lines.length > 0);

  if (docs.length > 0) {
    await AcademyDue.insertMany(docs, { ordered: false }).catch((error: { code?: number }) => {
      if (error?.code !== 11000) throw error;
    });
  }
  return { month, created: docs.length };
}

/** Money still owed for months up to and including `uptoMonth`. */
export async function outstandingByStudent(studentIds: Types.ObjectId[] | string[], uptoMonth = currentMonthKey()) {
  if (studentIds.length === 0) return new Map<string, number>();
  const rows = await AcademyDue.aggregate<{ _id: Types.ObjectId; total: number }>([
    {
      $match: {
        studentId: { $in: studentIds.map((id) => new Types.ObjectId(String(id))) },
        status: { $in: ["unpaid", "partial"] },
        month: { $lte: uptoMonth },
      },
    },
    { $group: { _id: "$studentId", total: { $sum: { $subtract: ["$amount", "$paid"] } } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), Math.max(0, row.total)]));
}

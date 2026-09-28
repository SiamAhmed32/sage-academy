import "server-only";

import { cache } from "react";
import { Types } from "mongoose";

import {
  subjectTone,
  type BatchGender,
  type DiscountType,
  type DueKind,
  type PaymentMethod,
  type StudentGender,
  type Version,
  type WeekDay,
} from "@/lib/academy/constants";
import { batchLabel, currentMonthKey } from "@/lib/academy/codes";
import { discountAmount, feeForMonth, type FeeEntry } from "@/lib/academy/fees";
import { connectDB } from "@/lib/mongodb";
import AcademyActivity from "@/models/academy/AcademyActivity";
import AcademyBatch from "@/models/academy/AcademyBatch";
import AcademyClass from "@/models/academy/AcademyClass";
import AcademyDue from "@/models/academy/AcademyDue";
import AcademyEnrollment from "@/models/academy/AcademyEnrollment";
import AcademyPayment from "@/models/academy/AcademyPayment";
import AcademyStudent from "@/models/academy/AcademyStudent";
import AcademySubject from "@/models/academy/AcademySubject";
import Teacher from "@/models/Teacher";

type Id = Types.ObjectId;
const str = (value: unknown) => (value == null ? "" : String(value));

// ───────────── Raw lean shapes ─────────────

type RawClass = { _id: Id; name: string; level: number; isArchived: boolean };
type RawSubject = { _id: Id; classId: Id; name: string; code: string; fees: FeeEntry[]; isArchived: boolean };
type RawSlot = { _id: Id; subjectId: Id; day: WeekDay; start: string; end: string; room: string };
type RawBatch = {
  _id: Id;
  code: string;
  year: number;
  classId: Id;
  classLevel: number;
  gender: BatchGender;
  version: Version;
  sequence: number;
  capacity: number;
  subjects: { subjectId: Id; teacherId: Id | null }[];
  routine: RawSlot[];
  note: string;
  status: "active" | "archived";
};
type RawStudent = {
  _id: Id;
  studentId: string;
  name: string;
  nameBangla: string;
  gender: StudentGender;
  version: Version;
  classId: Id;
  homeBatchId: Id;
  phone: string;
  whatsapp: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  fatherName: string;
  motherName: string;
  schoolName: string;
  dateOfBirth: Date | null;
  address: string;
  admissionDate: Date;
  note: string;
  status: "active" | "inactive";
  createdAt: Date;
};
type RawEnrollment = {
  _id: Id;
  studentId: Id;
  subjectId: Id;
  batchId: Id;
  discountType: DiscountType;
  discountValue: number;
  discountNote: string;
  startMonth: string;
  endMonth: string | null;
  status: "active" | "dropped";
  history: { action: string; fromBatchId: Id | null; toBatchId: Id | null; note: string; at: Date; by: { name: string } | null }[];
};

// ───────────── Client-facing shapes ─────────────

export type ClassOption = { id: string; name: string; level: number };

export type TeacherOption = { id: string; name: string; subject: string };

export type SubjectOption = {
  id: string;
  classId: string;
  name: string;
  code: string;
  bangla: number;
  english: number;
};

export type SlotView = {
  id: string;
  subjectId: string;
  day: WeekDay;
  start: string;
  end: string;
  room: string;
};

export type BatchOption = {
  id: string;
  code: string;
  label: string;
  year: number;
  classId: string;
  classLevel: number;
  gender: BatchGender;
  version: Version;
  capacity: number;
  students: number;
  subjects: { subjectId: string; name: string; fee: number; teacherId: string; teacherName: string }[];
  routine: SlotView[];
};

// ───────────── Shared helpers ─────────────

async function classMap() {
  const classes = await AcademyClass.find().lean<RawClass[]>();
  return new Map(classes.map((item) => [str(item._id), item]));
}

async function teacherMap(ids?: string[]) {
  const query = ids ? { _id: { $in: ids.filter(Boolean) } } : {};
  const teachers = await Teacher.find(query).select("name subject").lean<{ _id: Id; name: string; subject: string }[]>();
  return new Map(teachers.map((teacher) => [str(teacher._id), teacher]));
}

/** Distinct active students per batch (a student counts once, however many subjects). */
export async function batchStudentCounts(batchIds: (Id | string)[]) {
  if (batchIds.length === 0) return new Map<string, number>();
  const rows = await AcademyEnrollment.aggregate<{ _id: Id; students: number }>([
    { $match: { batchId: { $in: batchIds.map((id) => new Types.ObjectId(str(id))) }, status: "active" } },
    { $group: { _id: { batchId: "$batchId", studentId: "$studentId" } } },
    { $group: { _id: "$_id.batchId", students: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [str(row._id), row.students]));
}

function toSlot(slot: RawSlot): SlotView {
  return { id: str(slot._id), subjectId: str(slot.subjectId), day: slot.day, start: slot.start, end: slot.end, room: slot.room ?? "" };
}

// ───────────── Classes ─────────────

export async function listClassOptions(): Promise<ClassOption[]> {
  await connectDB();
  const classes = await AcademyClass.find({ isArchived: false }).sort({ level: 1 }).lean<RawClass[]>();
  return classes.map((item) => ({ id: str(item._id), name: item.name, level: item.level }));
}

// ───────────── Subjects ─────────────

export async function listSubjectOptions(): Promise<SubjectOption[]> {
  await connectDB();
  const month = currentMonthKey();
  const subjects = await AcademySubject.find({ isArchived: false }).sort({ name: 1 }).lean<RawSubject[]>();
  return subjects.map((subject) => ({
    id: str(subject._id),
    classId: str(subject.classId),
    name: subject.name,
    code: subject.code,
    bangla: feeForMonth(subject.fees, "bangla", month),
    english: feeForMonth(subject.fees, "english", month),
  }));
}

// ───────────── Teachers ─────────────

export async function listTeacherOptions(): Promise<TeacherOption[]> {
  await connectDB();
  const teachers = await Teacher.find().sort({ name: 1 }).select("name subject").lean<{ _id: Id; name: string; subject: string }[]>();
  return teachers.map((teacher) => ({ id: str(teacher._id), name: teacher.name, subject: teacher.subject }));
}

// ───────────── Batches ─────────────

async function hydrateBatches(batches: RawBatch[]): Promise<BatchOption[]> {
  const month = currentMonthKey();
  const subjectIds = [...new Set(batches.flatMap((batch) => batch.subjects.map((item) => str(item.subjectId))))];
  const teacherIds = [...new Set(batches.flatMap((batch) => batch.subjects.map((item) => str(item.teacherId))))];
  const [subjects, teachers, counts] = await Promise.all([
    AcademySubject.find({ _id: { $in: subjectIds } }).lean<RawSubject[]>(),
    teacherMap(teacherIds),
    batchStudentCounts(batches.map((batch) => batch._id)),
  ]);
  const subjectById = new Map(subjects.map((subject) => [str(subject._id), subject]));
  return batches.map((batch) => ({
    id: str(batch._id),
    code: batch.code,
    label: batchLabel(batch),
    year: batch.year,
    classId: str(batch.classId),
    classLevel: batch.classLevel,
    gender: batch.gender,
    version: batch.version,
    capacity: batch.capacity,
    students: counts.get(str(batch._id)) ?? 0,
    subjects: batch.subjects
      .map((item) => {
        const subject = subjectById.get(str(item.subjectId));
        const teacher = teachers.get(str(item.teacherId));
        return {
          subjectId: str(item.subjectId),
          name: subject?.name ?? "Subject",
          fee: subject ? feeForMonth(subject.fees, batch.version, month) : 0,
          teacherId: str(item.teacherId),
          teacherName: teacher?.name ?? "",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    routine: batch.routine.map(toSlot),
  }));
}

/** Active batches, shared for the rest of this request (dashboard calls this twice). */
export const listActiveBatchOptions = cache(async () => {
  await connectDB();
  const batches = await AcademyBatch.find({ status: "active" }).sort({ year: -1, classLevel: 1, code: 1 }).lean<RawBatch[]>();
  return hydrateBatches(batches);
});

export async function listBatchOptions(filter: { status?: "active" | "archived" | "all" } = {}) {
  if (!filter.status || filter.status === "active") return listActiveBatchOptions();
  await connectDB();
  const query = filter.status === "all" ? {} : { status: filter.status };
  const batches = await AcademyBatch.find(query).sort({ year: -1, classLevel: 1, code: 1 }).lean<RawBatch[]>();
  return hydrateBatches(batches);
}

export async function getBatchDetail(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return null;
  const batch = await AcademyBatch.findById(id).lean<RawBatch>();
  if (!batch) return null;
  const [hydrated] = await hydrateBatches([batch]);
  const classes = await classMap();

  const enrollments = await AcademyEnrollment.find({ batchId: batch._id, status: "active" }).lean<RawEnrollment[]>();
  const studentIds = [...new Set(enrollments.map((row) => str(row.studentId)))];
  const students = await AcademyStudent.find({ _id: { $in: studentIds } })
    .select("studentId name phone guardianPhone status homeBatchId")
    .lean<RawStudent[]>();
  const subjectName = new Map(hydrated.subjects.map((item) => [item.subjectId, item]));

  const roster = students
    .map((student) => {
      const rows = enrollments.filter((row) => str(row.studentId) === str(student._id));
      const monthly = rows.reduce((sum, row) => {
        const fee = subjectName.get(str(row.subjectId))?.fee ?? 0;
        return sum + Math.max(0, fee - discountAmount(fee, row.discountType, row.discountValue));
      }, 0);
      return {
        id: str(student._id),
        studentId: student.studentId,
        name: student.name,
        phone: student.guardianPhone || student.phone,
        isHome: str(student.homeBatchId) === str(batch._id),
        subjects: rows.map((row) => subjectName.get(str(row.subjectId))?.name ?? "Subject").sort(),
        monthly,
      };
    })
    .sort((a, b) => a.studentId.localeCompare(b.studentId));

  const subjectStudents = new Map<string, number>();
  for (const row of enrollments) {
    subjectStudents.set(str(row.subjectId), (subjectStudents.get(str(row.subjectId)) ?? 0) + 1);
  }

  return {
    ...hydrated,
    status: batch.status,
    note: batch.note,
    className: classes.get(str(batch.classId))?.name ?? `Class ${batch.classLevel}`,
    roster,
    subjectStudents: Object.fromEntries(subjectStudents),
  };
}

/** Slots of all active batches (for clash checks and the timetable page). */
export async function allActiveSlots() {
  const batches = await listActiveBatchOptions();
  return batches.flatMap((batch) =>
    batch.routine.map((slot) => {
      const subject = batch.subjects.find((item) => item.subjectId === slot.subjectId);
      return {
        ...slot,
        batchId: batch.id,
        batchCode: batch.code,
        classLevel: batch.classLevel,
        subjectName: subject?.name ?? "Subject",
        teacherId: subject?.teacherId || null,
        teacherName: subject?.teacherName ?? "",
      };
    })
  );
}

export type TeacherTeaching = {
  batches: { batchId: string; code: string; subjectName: string; weekly: number }[];
  weekly: number;
};

/** What each teacher teaches in active batches: batch + subject pairs and weekly class counts. */
export async function teacherTeaching() {
  const batches = await listBatchOptions();
  const map = new Map<string, TeacherTeaching>();
  for (const batch of batches) {
    for (const subject of batch.subjects) {
      if (!subject.teacherId) continue;
      const weekly = batch.routine.filter((slot) => slot.subjectId === subject.subjectId).length;
      const entry = map.get(subject.teacherId) ?? { batches: [], weekly: 0 };
      entry.batches.push({ batchId: batch.id, code: batch.code, subjectName: subject.name, weekly });
      entry.weekly += weekly;
      map.set(subject.teacherId, entry);
    }
  }
  return map;
}

export function slotsToTimetable(
  slots: Awaited<ReturnType<typeof allActiveSlots>>,
  options: { linkToBatch?: boolean; showCode?: boolean } = {}
) {
  return slots.map((slot) => ({
    key: `${slot.batchId}-${slot.id}`,
    day: slot.day,
    start: slot.start,
    end: slot.end,
    subject: slot.subjectName,
    meta: [options.showCode === false ? "" : slot.batchCode, slot.room ? `Room ${slot.room}` : ""].filter(Boolean).join(" · "),
    teacher: slot.teacherName,
    tone: subjectTone(slot.subjectName),
    href: options.linkToBatch ? `/admin/academy/batches/${slot.batchId}` : undefined,
  }));
}

// ───────────── Students ─────────────

export async function searchStudentsLite(q: string, limit = 8) {
  await connectDB();
  const text = q.trim();
  if (!text) return [];
  const safe = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(safe, "i");
  const students = await AcademyStudent.find({
    $or: [{ name: regex }, { studentId: regex }, { phone: regex }, { guardianPhone: regex }, { guardianName: regex }],
  })
    .sort({ status: 1, name: 1 })
    .limit(limit)
    .select("studentId name guardianPhone phone classId homeBatchId status")
    .lean<RawStudent[]>();
  const [classes, batches] = await Promise.all([
    classMap(),
    AcademyBatch.find({ _id: { $in: students.map((student) => student.homeBatchId) } })
      .select("code")
      .lean<{ _id: Id; code: string }[]>(),
  ]);
  const batchCode = new Map(batches.map((batch) => [str(batch._id), batch.code]));
  return students.map((student) => ({
    id: str(student._id),
    studentId: student.studentId,
    name: student.name,
    phone: student.guardianPhone || student.phone,
    className: classes.get(str(student.classId))?.name ?? "",
    batchCode: batchCode.get(str(student.homeBatchId)) ?? "",
    status: student.status,
  }));
}

export type StudentDetail = NonNullable<Awaited<ReturnType<typeof getStudentDetail>>>;

export async function getStudentDetail(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return null;
  const student = await AcademyStudent.findById(id).lean<RawStudent>();
  if (!student) return null;
  const month = currentMonthKey();

  const [classes, enrollments, dues, payments, activity] = await Promise.all([
    classMap(),
    AcademyEnrollment.find({ studentId: student._id }).sort({ status: 1, createdAt: 1 }).lean<RawEnrollment[]>(),
    AcademyDue.find({ studentId: student._id }).sort({ month: -1, createdAt: -1 }).lean(),
    AcademyPayment.find({ studentId: student._id }).sort({ paidAt: -1 }).lean(),
    AcademyActivity.find({ studentId: student._id }).sort({ createdAt: -1 }).limit(40).lean(),
  ]);

  const batchIds = [...new Set([str(student.homeBatchId), ...enrollments.map((row) => str(row.batchId))])];
  const batchesRaw = await AcademyBatch.find({ _id: { $in: batchIds } }).lean<RawBatch[]>();
  const batches = await hydrateBatches(batchesRaw);
  const batchById = new Map(batches.map((batch) => [batch.id, batch]));
  const subjectsRaw = await AcademySubject.find({ _id: { $in: enrollments.map((row) => row.subjectId) } }).lean<RawSubject[]>();
  const subjectById = new Map(subjectsRaw.map((subject) => [str(subject._id), subject]));

  const subjects = enrollments.map((row) => {
    const subject = subjectById.get(str(row.subjectId));
    const batch = batchById.get(str(row.batchId));
    const fee = subject ? feeForMonth(subject.fees, student.version, month) : 0;
    const discount = discountAmount(fee, row.discountType, row.discountValue);
    return {
      enrollmentId: str(row._id),
      subjectId: str(row.subjectId),
      name: subject?.name ?? "Subject",
      batchId: str(row.batchId),
      batchCode: batch?.code ?? "",
      teacherName: batch?.subjects.find((item) => item.subjectId === str(row.subjectId))?.teacherName ?? "",
      fee,
      discountType: row.discountType,
      discountValue: row.discountValue,
      discountNote: row.discountNote,
      discount,
      monthly: Math.max(0, fee - discount),
      status: row.status,
      startMonth: row.startMonth,
      endMonth: row.endMonth,
      history: row.history.map((entry) => ({
        action: entry.action,
        from: batchById.get(str(entry.fromBatchId))?.code ?? "",
        to: batchById.get(str(entry.toBatchId))?.code ?? "",
        note: entry.note,
        at: entry.at?.toISOString?.() ?? "",
        by: entry.by?.name ?? "",
      })),
    };
  });

  const routine = subjects
    .filter((row) => row.status === "active")
    .flatMap((row) => {
      const batch = batchById.get(row.batchId);
      return (batch?.routine ?? [])
        .filter((slot) => slot.subjectId === row.subjectId)
        .map((slot) => ({
          ...slot,
          batchId: row.batchId,
          batchCode: row.batchCode,
          classLevel: batch?.classLevel ?? 0,
          subjectName: row.name,
          teacherId: null,
          teacherName: row.teacherName,
        }));
    });

  const outstanding = dues
    .filter((due) => (due.status === "unpaid" || due.status === "partial") && due.month <= month)
    .reduce((sum, due) => sum + Math.max(0, due.amount - due.paid), 0);
  const upcoming = dues
    .filter((due) => (due.status === "unpaid" || due.status === "partial") && due.month > month)
    .reduce((sum, due) => sum + Math.max(0, due.amount - due.paid), 0);
  const year = String(new Date().getFullYear());
  const paidThisYear = payments
    .filter((payment) => payment.status === "valid" && new Date(payment.paidAt).getFullYear().toString() === year)
    .reduce((sum, payment) => sum + payment.amount, 0);

  const homeBatch = batchById.get(str(student.homeBatchId));

  return {
    student: {
      id: str(student._id),
      studentId: student.studentId,
      name: student.name,
      nameBangla: student.nameBangla,
      gender: student.gender,
      version: student.version,
      classId: str(student.classId),
      className: classes.get(str(student.classId))?.name ?? "",
      classLevel: classes.get(str(student.classId))?.level ?? 0,
      homeBatchId: str(student.homeBatchId),
      homeBatchCode: homeBatch?.code ?? "",
      homeBatchLabel: homeBatch?.label ?? "",
      phone: student.phone,
      whatsapp: student.whatsapp,
      guardianName: student.guardianName,
      guardianRelation: student.guardianRelation,
      guardianPhone: student.guardianPhone,
      fatherName: student.fatherName,
      motherName: student.motherName,
      schoolName: student.schoolName,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString() : "",
      address: student.address,
      admissionDate: student.admissionDate ? new Date(student.admissionDate).toISOString() : "",
      note: student.note,
      status: student.status,
    },
    subjects,
    routine,
    monthlyTuition: subjects.filter((row) => row.status === "active").reduce((sum, row) => sum + row.monthly, 0),
    outstanding,
    upcoming,
    paidThisYear,
    dues: dues.map((due) => ({
      id: str(due._id),
      month: due.month,
      kind: due.kind as DueKind,
      label: due.label,
      amount: due.amount,
      paid: due.paid,
      status: due.status,
      lines: (due.lines ?? []).map((line) => ({
        subjectName: line.subjectName,
        batchCode: line.batchCode,
        fee: line.fee,
        discount: line.discount,
        amount: line.amount,
      })),
      adjustment: due.adjustment ?? 0,
      adjustmentNote: due.adjustmentNote ?? "",
      note: due.note ?? "",
    })),
    payments: payments.map((payment) => ({
      id: str(payment._id),
      receiptNo: payment.receiptNo,
      amount: payment.amount,
      method: payment.method as PaymentMethod,
      paidAt: new Date(payment.paidAt).toISOString(),
      status: payment.status,
      receivedBy: payment.receivedBy?.name ?? "",
      months: [...new Set(payment.allocations.map((allocation) => allocation.month))],
    })),
    activity: activity.map((entry) => ({
      id: str(entry._id),
      action: entry.action,
      message: entry.message,
      by: entry.by?.name ?? "",
      at: new Date(entry.createdAt as Date).toISOString(),
    })),
  };
}

// ───────────── Dues & receipts ─────────────

export async function getReceipt(receiptNo: string) {
  await connectDB();
  const payment = await AcademyPayment.findOne({ receiptNo }).lean();
  if (!payment) return null;
  const student = await AcademyStudent.findById(payment.studentId).select("guardianPhone whatsapp phone").lean<RawStudent>();
  return {
    id: str(payment._id),
    receiptNo: payment.receiptNo,
    studentId: str(payment.studentId),
    amount: payment.amount,
    method: payment.method as PaymentMethod,
    transactionId: payment.transactionId,
    paidAt: new Date(payment.paidAt).toISOString(),
    note: payment.note,
    snapshot: {
      studentName: payment.snapshot?.studentName ?? "",
      studentCode: payment.snapshot?.studentCode ?? "",
      className: payment.snapshot?.className ?? "",
      batchCode: payment.snapshot?.batchCode ?? "",
      version: (payment.snapshot?.version ?? "bangla") as Version,
      guardianPhone: payment.snapshot?.guardianPhone ?? "",
    },
    whatsapp: student?.whatsapp || student?.guardianPhone || payment.snapshot?.guardianPhone || "",
    allocations: payment.allocations.map((allocation) => ({
      month: allocation.month,
      kind: allocation.kind as DueKind,
      label: allocation.label,
      dueAmount: allocation.dueAmount,
      discount: allocation.discount,
      amount: allocation.amount,
      lines: (allocation.lines ?? []).map((line) => ({
        subjectName: line.subjectName ?? "",
        batchCode: line.batchCode ?? "",
        fee: line.fee ?? 0,
        discount: line.discount ?? 0,
        amount: line.amount ?? 0,
      })),
    })),
    discountTotal: payment.discountTotal,
    oneTimeDiscount: payment.oneTimeDiscount ?? 0,
    oneTimeDiscountNote: payment.oneTimeDiscountNote ?? "",
    dueAfter: payment.dueAfter,
    receivedBy: payment.receivedBy?.name ?? "",
    status: payment.status,
    voidReason: payment.voidReason,
    voidedBy: payment.voidedBy?.name ?? "",
    voidedAt: payment.voidedAt ? new Date(payment.voidedAt).toISOString() : "",
  };
}

export type ReceiptView = NonNullable<Awaited<ReturnType<typeof getReceipt>>>;

// ───────────── Dashboard ─────────────

export async function getDashboardData() {
  await connectDB();
  const month = currentMonthKey();
  const [activeStudents, newThisMonth, monthDues, openDues, recentPayments, batches, collectedThisMonth] = await Promise.all([
    AcademyStudent.countDocuments({ status: "active" }),
    AcademyStudent.countDocuments({ createdAt: { $gte: new Date(`${month}-01T00:00:00+06:00`) } }),
    AcademyDue.aggregate<{ billed: number; paid: number }>([
      { $match: { month, status: { $ne: "void" } } },
      { $group: { _id: null, billed: { $sum: "$amount" }, paid: { $sum: "$paid" } } },
    ]),
    AcademyDue.aggregate<{ _id: Id; owed: number; months: number }>([
      { $match: { status: { $in: ["unpaid", "partial"] }, month: { $lte: month } } },
      { $group: { _id: "$studentId", owed: { $sum: { $subtract: ["$amount", "$paid"] } }, months: { $sum: 1 } } },
      { $sort: { owed: -1 } },
    ]),
    AcademyPayment.find({ status: "valid" }).sort({ paidAt: -1 }).limit(6).lean(),
    listActiveBatchOptions(),
    AcademyPayment.aggregate<{ total: number }>([
      { $match: { status: "valid", paidAt: { $gte: new Date(`${month}-01T00:00:00+06:00`) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const owingIds = openDues.slice(0, 6).map((row) => row._id);
  const owingStudents = await AcademyStudent.find({ _id: { $in: owingIds } }).select("studentId name").lean<RawStudent[]>();
  const owingById = new Map(owingStudents.map((student) => [str(student._id), student]));

  return {
    month,
    activeStudents,
    newThisMonth,
    billed: monthDues[0]?.billed ?? 0,
    paidAgainstMonth: monthDues[0]?.paid ?? 0,
    collectedThisMonth: collectedThisMonth[0]?.total ?? 0,
    outstanding: openDues.reduce((sum, row) => sum + Math.max(0, row.owed), 0),
    studentsWithDues: openDues.length,
    topOwing: openDues.slice(0, 6).map((row) => ({
      id: str(row._id),
      name: owingById.get(str(row._id))?.name ?? "Student",
      studentId: owingById.get(str(row._id))?.studentId ?? "",
      owed: row.owed,
      months: row.months,
    })),
    recentPayments: recentPayments.map((payment) => ({
      id: str(payment._id),
      receiptNo: payment.receiptNo,
      name: payment.snapshot?.studentName ?? "",
      amount: payment.amount,
      method: payment.method as PaymentMethod,
      paidAt: new Date(payment.paidAt).toISOString(),
      months: [...new Set(payment.allocations.map((allocation) => allocation.month))],
    })),
    batches,
  };
}

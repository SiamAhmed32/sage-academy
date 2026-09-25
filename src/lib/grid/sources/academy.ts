import "server-only";

import type { PipelineStage } from "mongoose";

import { currentMonthKey } from "@/lib/academy/codes";
import { runGridAggregate, runGridFind, type GridField } from "@/lib/grid/query";
import type { GridSource } from "@/lib/grid/registry";
import AcademyBatch from "@/models/academy/AcademyBatch";
import AcademyClass from "@/models/academy/AcademyClass";
import AcademyDue from "@/models/academy/AcademyDue";
import AcademyPayment from "@/models/academy/AcademyPayment";
import AcademyStudent from "@/models/academy/AcademyStudent";
import AcademySubject from "@/models/academy/AcademySubject";

const id = (value: unknown) => (value == null ? "" : String(value));
const iso = (value: unknown) => (value ? new Date(value as string).toISOString() : "");
const monthStart = (month: string) => new Date(`${month}-01T00:00:00+06:00`);

// ───────────── Students ─────────────

const studentFields: Record<string, GridField> = {
  studentId: { path: "studentId", type: "text" },
  name: { path: "name", type: "text" },
  phone: { path: "guardianPhone", type: "text" },
  guardianName: { path: "guardianName", type: "text" },
  className: { path: "className", type: "text" },
  classLevel: { path: "classLevel", type: "set" },
  batchCode: { path: "batchCode", type: "text" },
  version: { path: "version", type: "set" },
  gender: { path: "gender", type: "set" },
  subjects: { path: "subjects", type: "number" },
  monthly: { path: "monthly", type: "number", filterable: false },
  due: { path: "due", type: "number" },
  status: { path: "status", type: "set" },
  admissionDate: { path: "admissionDate", type: "date" },
};

export const studentsSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const month = currentMonthKey();
    const presetMatch: Record<string, unknown> =
      request.preset === "active"
        ? { status: "active" }
        : request.preset === "inactive"
          ? { status: "inactive" }
          : request.preset === "new"
            ? { createdAt: { $gte: monthStart(month) } }
            : {};
    const prepare: PipelineStage[] = [
      { $match: presetMatch },
      { $lookup: { from: "academy_classes", localField: "classId", foreignField: "_id", as: "cls" } },
      { $lookup: { from: "academy_batches", localField: "homeBatchId", foreignField: "_id", as: "batch" } },
      {
        $lookup: {
          from: "academy_enrollments",
          let: { sid: "$_id" },
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$studentId", "$$sid"] }, { $eq: ["$status", "active"] }] } } }, { $count: "n" }],
          as: "enrolled",
        },
      },
      {
        $lookup: {
          from: "academy_dues",
          let: { sid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$studentId", "$$sid"] },
                    { $in: ["$status", ["unpaid", "partial"]] },
                    { $lte: ["$month", month] },
                  ],
                },
              },
            },
            { $group: { _id: null, owed: { $sum: { $subtract: ["$amount", "$paid"] } } } },
          ],
          as: "owed",
        },
      },
      {
        $addFields: {
          className: { $ifNull: [{ $first: "$cls.name" }, ""] },
          classLevel: { $ifNull: [{ $first: "$cls.level" }, 0] },
          batchCode: { $ifNull: [{ $first: "$batch.code" }, ""] },
          subjects: { $ifNull: [{ $first: "$enrolled.n" }, 0] },
          due: { $max: [0, { $ifNull: [{ $first: "$owed.owed" }, 0] }] },
        },
      },
      ...(request.preset === "dues" ? [{ $match: { due: { $gt: 0 } } } as PipelineStage] : []),
      { $project: { cls: 0, batch: 0, enrolled: 0, owed: 0 } },
    ];
    return runGridAggregate({
      model: AcademyStudent as never,
      request,
      fields: studentFields,
      searchPaths: ["name", "studentId", "guardianPhone", "phone", "guardianName", "batchCode"],
      prepare,
      defaultSort: { createdAt: -1 },
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          studentId: doc.studentId,
          name: doc.name,
          phone: doc.guardianPhone || doc.phone,
          guardianName: doc.guardianName,
          className: doc.className,
          classLevel: doc.classLevel,
          batchCode: doc.batchCode,
          batchId: id(doc.homeBatchId),
          version: doc.version,
          gender: doc.gender,
          subjects: doc.subjects,
          due: doc.due,
          status: doc.status,
          admissionDate: iso(doc.admissionDate),
        })),
    });
  },
};

// ───────────── Batches ─────────────

const batchFields: Record<string, GridField> = {
  code: { path: "code", type: "text" },
  year: { path: "year", type: "number" },
  classLevel: { path: "classLevel", type: "set" },
  gender: { path: "gender", type: "set" },
  version: { path: "version", type: "set" },
  subjectCount: { path: "subjectCount", type: "number" },
  subjectNames: { path: "subjectNames", type: "text" },
  students: { path: "students", type: "number" },
  capacity: { path: "capacity", type: "number" },
  seatsLeft: { path: "seatsLeft", type: "number" },
  routineCount: { path: "routineCount", type: "number" },
  status: { path: "status", type: "set" },
};

export const batchesSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const presetMatch: Record<string, unknown> =
      request.preset === "archived" ? { status: "archived" } : request.preset === "all" ? {} : { status: "active" };
    const prepare: PipelineStage[] = [
      { $match: presetMatch },
      {
        $lookup: {
          from: "academy_enrollments",
          let: { bid: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$batchId", "$$bid"] }, { $eq: ["$status", "active"] }] } } },
            { $group: { _id: "$studentId" } },
            { $count: "n" },
          ],
          as: "enrolled",
        },
      },
      { $lookup: { from: "academy_subjects", localField: "subjects.subjectId", foreignField: "_id", as: "subjectDocs" } },
      {
        $addFields: {
          students: { $ifNull: [{ $first: "$enrolled.n" }, 0] },
          subjectCount: { $size: "$subjects" },
          subjectNames: {
            $reduce: {
              input: "$subjectDocs.name",
              initialValue: "",
              in: { $cond: [{ $eq: ["$$value", ""] }, "$$this", { $concat: ["$$value", ", ", "$$this"] }] },
            },
          },
          routineCount: { $size: "$routine" },
        },
      },
      { $addFields: { seatsLeft: { $subtract: ["$capacity", "$students"] } } },
      ...(request.preset === "full" ? [{ $match: { seatsLeft: { $lte: 0 } } } as PipelineStage] : []),
      ...(request.preset === "no-routine" ? [{ $match: { routineCount: 0 } } as PipelineStage] : []),
      { $project: { enrolled: 0, subjectDocs: 0, routine: 0 } },
    ];
    return runGridAggregate({
      model: AcademyBatch as never,
      request,
      fields: batchFields,
      searchPaths: ["code", "subjectNames", "note"],
      prepare,
      defaultSort: { year: -1, classLevel: 1, code: 1 },
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          code: doc.code,
          year: doc.year,
          classLevel: doc.classLevel,
          gender: doc.gender,
          version: doc.version,
          subjectCount: doc.subjectCount,
          subjectNames: doc.subjectNames,
          students: doc.students,
          capacity: doc.capacity,
          seatsLeft: doc.seatsLeft,
          routineCount: doc.routineCount,
          status: doc.status,
        })),
    });
  },
};

// ───────────── Subjects ─────────────

const subjectFields: Record<string, GridField> = {
  name: { path: "name", type: "text" },
  code: { path: "code", type: "text" },
  className: { path: "className", type: "text" },
  classLevel: { path: "classLevel", type: "set" },
  bangla: { path: "bangla", type: "number" },
  english: { path: "english", type: "number" },
  batches: { path: "batches", type: "number" },
  students: { path: "students", type: "number" },
  status: { path: "status", type: "set" },
};

export const subjectsSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const month = currentMonthKey();
    const classId = request.params?.classId;
    const presetMatch: Record<string, unknown> =
      request.preset === "archived" ? { isArchived: true } : request.preset === "all" ? {} : { isArchived: false };
    const prepare: PipelineStage[] = [
      { $match: presetMatch },
      { $lookup: { from: "academy_classes", localField: "classId", foreignField: "_id", as: "cls" } },
      {
        $lookup: {
          from: "academy_batches",
          let: { sid: "$_id" },
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$status", "active"] }, { $in: ["$$sid", "$subjects.subjectId"] }] } } }, { $count: "n" }],
          as: "inBatches",
        },
      },
      {
        $lookup: {
          from: "academy_enrollments",
          let: { sid: "$_id" },
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$subjectId", "$$sid"] }, { $eq: ["$status", "active"] }] } } }, { $count: "n" }],
          as: "taking",
        },
      },
      {
        $addFields: {
          className: { $ifNull: [{ $first: "$cls.name" }, ""] },
          classLevel: { $ifNull: [{ $first: "$cls.level" }, 0] },
          classKey: { $toString: "$classId" },
          batches: { $ifNull: [{ $first: "$inBatches.n" }, 0] },
          students: { $ifNull: [{ $first: "$taking.n" }, 0] },
          status: { $cond: ["$isArchived", "archived", "active"] },
          // Fee in force this month = latest entry starting on or before it.
          current: {
            $reduce: {
              input: { $filter: { input: "$fees", cond: { $lte: ["$$this.effectiveFrom", month] } } },
              initialValue: null,
              in: {
                $cond: [
                  { $or: [{ $eq: ["$$value", null] }, { $gt: ["$$this.effectiveFrom", "$$value.effectiveFrom"] }] },
                  "$$this",
                  "$$value",
                ],
              },
            },
          },
          upcoming: { $first: { $filter: { input: "$fees", cond: { $gt: ["$$this.effectiveFrom", month] } } } },
        },
      },
      ...(classId ? [{ $match: { classKey: classId } } as PipelineStage] : []),
      { $addFields: { bangla: { $ifNull: ["$current.bangla", 0] }, english: { $ifNull: ["$current.english", 0] } } },
      ...(request.preset === "scheduled" ? [{ $match: { upcoming: { $ne: null } } } as PipelineStage] : []),
      { $project: { cls: 0, inBatches: 0, taking: 0 } },
    ];
    return runGridAggregate({
      model: AcademySubject as never,
      request,
      fields: subjectFields,
      searchPaths: ["name", "code", "className"],
      prepare,
      defaultSort: { classLevel: 1, name: 1 },
      toRows: (docs) =>
        docs.map((doc) => {
          const upcoming = doc.upcoming as { effectiveFrom: string; bangla: number; english: number } | null;
          const fees = ((doc.fees as { effectiveFrom: string; bangla: number; english: number; setBy?: { name?: string } }[]) ?? [])
            .slice()
            .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
          return {
            id: id(doc._id),
            classId: id(doc.classId),
            className: doc.className,
            classLevel: doc.classLevel,
            name: doc.name,
            code: doc.code,
            isArchived: Boolean(doc.isArchived),
            status: doc.status,
            bangla: doc.bangla,
            english: doc.english,
            upcoming: upcoming ? { from: upcoming.effectiveFrom, bangla: upcoming.bangla, english: upcoming.english } : null,
            history: fees.map((entry) => ({ from: entry.effectiveFrom, bangla: entry.bangla, english: entry.english, by: entry.setBy?.name ?? "" })),
            batches: doc.batches,
            students: doc.students,
          };
        }),
    });
  },
};

// ───────────── Classes ─────────────

const classFields: Record<string, GridField> = {
  name: { path: "name", type: "text" },
  level: { path: "level", type: "number" },
  subjects: { path: "subjects", type: "number" },
  batches: { path: "batches", type: "number" },
  students: { path: "students", type: "number" },
  status: { path: "status", type: "set" },
};

export const classesSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const count = (from: string, field: string, extra: Record<string, unknown>) => ({
      $lookup: {
        from,
        let: { cid: "$_id" },
        pipeline: [{ $match: { $expr: { $eq: [`$${field}`, "$$cid"] }, ...extra } }, { $count: "n" }],
        as: `${from}_n`,
      },
    });
    const prepare: PipelineStage[] = [
      ...(request.preset === "archived" ? [{ $match: { isArchived: true } }] : request.preset === "all" ? [] : [{ $match: { isArchived: false } }]),
      count("academy_subjects", "classId", { isArchived: false }),
      count("academy_batches", "classId", { status: "active" }),
      count("academy_students", "classId", { status: "active" }),
      {
        $addFields: {
          subjects: { $ifNull: [{ $first: "$academy_subjects_n.n" }, 0] },
          batches: { $ifNull: [{ $first: "$academy_batches_n.n" }, 0] },
          students: { $ifNull: [{ $first: "$academy_students_n.n" }, 0] },
          status: { $cond: ["$isArchived", "archived", "active"] },
        },
      },
    ] as PipelineStage[];
    return runGridAggregate({
      model: AcademyClass as never,
      request,
      fields: classFields,
      searchPaths: ["name"],
      prepare,
      defaultSort: { level: 1 },
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          name: doc.name,
          level: doc.level,
          isArchived: Boolean(doc.isArchived),
          status: doc.status,
          subjects: doc.subjects,
          batches: doc.batches,
          students: doc.students,
        })),
    });
  },
};

// ───────────── Dues ─────────────

const dueFields: Record<string, GridField> = {
  studentName: { path: "studentName", type: "text" },
  studentCode: { path: "studentCode", type: "text" },
  batchCode: { path: "batchCode", type: "text" },
  month: { path: "month", type: "text" },
  kind: { path: "kind", type: "set" },
  label: { path: "label", type: "text" },
  amount: { path: "amount", type: "number" },
  paid: { path: "paid", type: "number" },
  remaining: { path: "remaining", type: "number" },
  status: { path: "status", type: "set" },
};

export const duesSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const month = currentMonthKey();
    const presetMatch: Record<string, unknown> =
      request.preset === "all"
        ? {}
        : request.preset === "this-month"
          ? { month, status: { $ne: "void" } }
          : request.preset === "paid"
            ? { status: "paid" }
            : request.preset === "void"
              ? { status: "void" }
              : request.preset === "advance"
                ? { month: { $gt: month }, status: { $ne: "void" } }
                : { status: { $in: ["unpaid", "partial"] }, month: { $lte: month } };
    const prepare: PipelineStage[] = [
      { $match: presetMatch },
      { $lookup: { from: "academy_students", localField: "studentId", foreignField: "_id", as: "student" } },
      { $lookup: { from: "academy_batches", localField: "student.homeBatchId", foreignField: "_id", as: "batch" } },
      {
        $addFields: {
          studentName: { $ifNull: [{ $first: "$student.name" }, ""] },
          studentCode: { $ifNull: [{ $first: "$student.studentId" }, ""] },
          phone: { $ifNull: [{ $first: "$student.guardianPhone" }, ""] },
          batchCode: { $ifNull: [{ $first: "$batch.code" }, ""] },
          remaining: { $cond: [{ $eq: ["$status", "void"] }, 0, { $max: [0, { $subtract: ["$amount", "$paid"] }] }] },
        },
      },
      { $project: { student: 0, batch: 0, lines: 0 } },
    ];
    return runGridAggregate({
      model: AcademyDue as never,
      request,
      fields: dueFields,
      searchPaths: ["studentName", "studentCode", "phone", "batchCode", "label"],
      prepare,
      defaultSort: { month: -1, createdAt: -1 },
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          studentId: id(doc.studentId),
          studentName: doc.studentName,
          studentCode: doc.studentCode,
          phone: doc.phone,
          batchCode: doc.batchCode,
          month: doc.month,
          kind: doc.kind,
          label: doc.label,
          amount: doc.amount,
          paid: doc.paid,
          remaining: doc.remaining,
          status: doc.status,
        })),
    });
  },
};

// ───────────── Receipts ─────────────

const receiptFields: Record<string, GridField> = {
  receiptNo: { path: "receiptNo", type: "text" },
  paidAt: { path: "paidAt", type: "date" },
  studentName: { path: "snapshot.studentName", type: "text" },
  studentCode: { path: "snapshot.studentCode", type: "text" },
  batchCode: { path: "snapshot.batchCode", type: "text" },
  method: { path: "method", type: "set" },
  amount: { path: "amount", type: "number" },
  receivedBy: { path: "receivedBy.name", type: "text" },
  status: { path: "status", type: "set" },
};

export const receiptsSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const month = currentMonthKey();
    const todayStart = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date())}T00:00:00+06:00`);
    const base: Record<string, unknown> =
      request.preset === "valid"
        ? { status: "valid" }
        : request.preset === "void"
          ? { status: "void" }
          : request.preset === "this-month"
            ? { status: "valid", paidAt: { $gte: monthStart(month) } }
            : request.preset === "today"
              ? { status: "valid", paidAt: { $gte: todayStart } }
              : request.preset === "online"
                ? { status: "valid", method: { $ne: "cash" }, paidAt: { $gte: monthStart(month) } }
                : {};
    return runGridFind({
      model: AcademyPayment,
      request,
      fields: receiptFields,
      searchPaths: ["receiptNo", "snapshot.studentName", "snapshot.studentCode", "snapshot.batchCode", "transactionId"],
      base,
      defaultSort: { paidAt: -1, createdAt: -1 },
      select: "receiptNo studentId amount method paidAt snapshot receivedBy status allocations.month allocations.kind",
      toRows: (docs) =>
        (docs as unknown as Record<string, never>[]).map((doc: Record<string, never>) => {
          const payment = doc as unknown as {
            _id: unknown;
            receiptNo: string;
            studentId: unknown;
            amount: number;
            method: string;
            paidAt: Date;
            snapshot?: { studentName?: string; studentCode?: string; batchCode?: string };
            receivedBy?: { name?: string };
            status: string;
            allocations?: { month: string; kind: string }[];
          };
          return {
            id: id(payment._id),
            receiptNo: payment.receiptNo,
            studentId: id(payment.studentId),
            studentName: payment.snapshot?.studentName ?? "",
            studentCode: payment.snapshot?.studentCode ?? "",
            batchCode: payment.snapshot?.batchCode ?? "",
            amount: payment.amount,
            method: payment.method,
            paidAt: iso(payment.paidAt),
            receivedBy: payment.receivedBy?.name ?? "",
            status: payment.status,
            months: [...new Set((payment.allocations ?? []).map((item) => item.month))],
            kinds: [...new Set((payment.allocations ?? []).map((item) => item.kind))],
          };
        }),
    });
  },
};

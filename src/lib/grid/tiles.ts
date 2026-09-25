import "server-only";

import { currentMonthKey, formatTaka } from "@/lib/academy/codes";
import { connectDB } from "@/lib/mongodb";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import AcademyBatch from "@/models/academy/AcademyBatch";
import AcademyClass from "@/models/academy/AcademyClass";
import AcademyDue from "@/models/academy/AcademyDue";
import AcademyEnrollment from "@/models/academy/AcademyEnrollment";
import AcademyPayment from "@/models/academy/AcademyPayment";
import AcademyStudent from "@/models/academy/AcademyStudent";
import AcademySubject from "@/models/academy/AcademySubject";

const monthStart = (month: string) => new Date(`${month}-01T00:00:00+06:00`);
const dhakaToday = () => new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date())}T00:00:00+06:00`);

/** Outstanding (up to this month) per student: [{_id, owed}]. */
async function owedByStudent() {
  const month = currentMonthKey();
  return AcademyDue.aggregate<{ _id: unknown; owed: number }>([
    { $match: { status: { $in: ["unpaid", "partial"] }, month: { $lte: month } } },
    { $group: { _id: "$studentId", owed: { $sum: { $subtract: ["$amount", "$paid"] } } } },
    { $match: { owed: { $gt: 0 } } },
  ]);
}

export async function studentTiles(): Promise<GridTile[]> {
  await connectDB();
  const month = currentMonthKey();
  const [all, active, inactive, fresh, owed] = await Promise.all([
    AcademyStudent.countDocuments({}),
    AcademyStudent.countDocuments({ status: "active" }),
    AcademyStudent.countDocuments({ status: "inactive" }),
    AcademyStudent.countDocuments({ createdAt: { $gte: monthStart(month) } }),
    owedByStudent(),
  ]);
  return [
    { key: "all", label: "All students", value: all, icon: "users", tone: "blue", preset: "" },
    { key: "active", label: "Active", value: active, icon: "active", tone: "green", preset: "active" },
    { key: "new", label: "New this month", value: fresh, icon: "calendar", tone: "purple", preset: "new" },
    {
      key: "dues",
      label: "With dues",
      value: owed.length,
      icon: "dues",
      tone: "amber",
      preset: "dues",
      note: formatTaka(owed.reduce((sum, row) => sum + row.owed, 0)),
    },
    { key: "inactive", label: "Left", value: inactive, icon: "inactive", tone: "zinc", preset: "inactive" },
  ];
}

export async function batchTiles(): Promise<GridTile[]> {
  await connectDB();
  const [active, archived, noRoutine, batches, seats] = await Promise.all([
    AcademyBatch.countDocuments({ status: "active" }),
    AcademyBatch.countDocuments({ status: "archived" }),
    AcademyBatch.countDocuments({ status: "active", routine: { $size: 0 } }),
    AcademyBatch.find({ status: "active" }).select("capacity").lean(),
    AcademyEnrollment.aggregate<{ _id: unknown; n: number }>([
      { $match: { status: "active" } },
      { $group: { _id: { b: "$batchId", s: "$studentId" } } },
      { $group: { _id: "$_id.b", n: { $sum: 1 } } },
    ]),
  ]);
  const taken = new Map(seats.map((row) => [String(row._id), row.n]));
  const full = batches.filter((batch) => (taken.get(String(batch._id)) ?? 0) >= batch.capacity).length;
  const capacity = batches.reduce((sum, batch) => sum + batch.capacity, 0);
  const used = batches.reduce((sum, batch) => sum + (taken.get(String(batch._id)) ?? 0), 0);
  return [
    { key: "active", label: "Active batches", value: active, icon: "batches", tone: "blue", preset: "" },
    { key: "seats", label: "Seats filled", value: `${used}/${capacity}`, icon: "users", tone: "green", note: capacity ? `${Math.round((used / capacity) * 100)}% full` : undefined },
    { key: "full", label: "Full batches", value: full, icon: "alert", tone: "red", preset: "full" },
    { key: "no-routine", label: "No routine yet", value: noRoutine, icon: "clock", tone: "amber", preset: "no-routine" },
    { key: "archived", label: "Archived", value: archived, icon: "archive", tone: "zinc", preset: "archived" },
  ];
}

export async function subjectTiles(): Promise<GridTile[]> {
  await connectDB();
  const month = currentMonthKey();
  const [active, archived, scheduled, classes] = await Promise.all([
    AcademySubject.countDocuments({ isArchived: false }),
    AcademySubject.countDocuments({ isArchived: true }),
    AcademySubject.countDocuments({ isArchived: false, "fees.effectiveFrom": { $gt: month } }),
    AcademyClass.countDocuments({ isArchived: false }),
  ]);
  return [
    { key: "active", label: "Active subjects", value: active, icon: "book", tone: "blue", preset: "" },
    { key: "classes", label: "Classes", value: classes, icon: "layers", tone: "purple" },
    { key: "scheduled", label: "Fee change scheduled", value: scheduled, icon: "calendar", tone: "amber", preset: "scheduled", note: "Starts next month" },
    { key: "archived", label: "Archived", value: archived, icon: "archive", tone: "zinc", preset: "archived" },
  ];
}

export async function classTiles(): Promise<GridTile[]> {
  await connectDB();
  const [active, archived, subjects, batches, students] = await Promise.all([
    AcademyClass.countDocuments({ isArchived: false }),
    AcademyClass.countDocuments({ isArchived: true }),
    AcademySubject.countDocuments({ isArchived: false }),
    AcademyBatch.countDocuments({ status: "active" }),
    AcademyStudent.countDocuments({ status: "active" }),
  ]);
  return [
    { key: "active", label: "Classes", value: active, icon: "layers", tone: "blue", preset: "" },
    { key: "subjects", label: "Subjects", value: subjects, icon: "book", tone: "purple" },
    { key: "batches", label: "Active batches", value: batches, icon: "batches", tone: "green" },
    { key: "students", label: "Active students", value: students, icon: "users", tone: "brand" },
    { key: "archived", label: "Archived", value: archived, icon: "archive", tone: "zinc", preset: "archived" },
  ];
}

export async function dueTiles(): Promise<GridTile[]> {
  await connectDB();
  const month = currentMonthKey();
  const sum = (match: Record<string, unknown>) =>
    AcademyDue.aggregate<{ n: number; owed: number; amount: number }>([
      { $match: match },
      { $group: { _id: null, n: { $sum: 1 }, owed: { $sum: { $subtract: ["$amount", "$paid"] } }, amount: { $sum: "$amount" } } },
    ]).then((rows) => rows[0] ?? { n: 0, owed: 0, amount: 0 });
  const [open, thisMonth, advance, owed, all] = await Promise.all([
    sum({ status: { $in: ["unpaid", "partial"] }, month: { $lte: month } }),
    sum({ month, status: { $ne: "void" } }),
    sum({ month: { $gt: month }, status: { $ne: "void" } }),
    owedByStudent(),
    AcademyDue.countDocuments({}),
  ]);
  return [
    { key: "open", label: "Outstanding", value: formatTaka(Math.max(0, open.owed)), icon: "dues", tone: "red", preset: "", note: `${open.n} open bills` },
    { key: "students", label: "Students owing", value: owed.length, icon: "users", tone: "amber", note: "Up to this month" },
    {
      key: "month",
      label: "This month billed",
      value: formatTaka(thisMonth.amount),
      icon: "calendar",
      tone: "blue",
      preset: "this-month",
      note: `${formatTaka(Math.max(0, thisMonth.owed))} still due`,
    },
    { key: "advance", label: "Advance bills", value: advance.n, icon: "clock", tone: "purple", preset: "advance" },
    { key: "all", label: "All bills", value: all, icon: "receipt", tone: "green", preset: "all", note: "Paid, open and cancelled" },
  ];
}

export async function receiptTiles(): Promise<GridTile[]> {
  await connectDB();
  const month = currentMonthKey();
  const total = (match: Record<string, unknown>) =>
    AcademyPayment.aggregate<{ n: number; amount: number }>([
      { $match: match },
      { $group: { _id: null, n: { $sum: 1 }, amount: { $sum: "$amount" } } },
    ]).then((rows) => rows[0] ?? { n: 0, amount: 0 });
  const [today, thisMonth, online, voided] = await Promise.all([
    total({ status: "valid", paidAt: { $gte: dhakaToday() } }),
    total({ status: "valid", paidAt: { $gte: monthStart(month) } }),
    total({ status: "valid", method: { $ne: "cash" }, paidAt: { $gte: monthStart(month) } }),
    total({ status: "void" }),
  ]);
  return [
    { key: "today", label: "Collected today", value: formatTaka(today.amount), icon: "wallet", tone: "green", preset: "today", note: `${today.n} receipts` },
    { key: "month", label: "This month", value: formatTaka(thisMonth.amount), icon: "receipt", tone: "blue", preset: "this-month", note: `${thisMonth.n} receipts` },
    { key: "online", label: "bKash / Nagad / bank", value: formatTaka(online.amount), icon: "dues", tone: "purple", preset: "online", note: "This month" },
    { key: "void", label: "Void receipts", value: voided.n, icon: "alert", tone: "red", preset: "void" },
  ];
}

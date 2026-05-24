import { cache } from "react";
import { redirect } from "next/navigation";

import { normalizeObjectId } from "@/lib/object-id";
import { getCurrentAuthUser } from "@/lib/auth-session";
import { normalizeBangladeshPhone } from "@/lib/bd-phone";
import {
  ensureAllBillingMonthsForStudent,
  shouldShowStudentBillingMonth,
} from "@/lib/billing";
import { connectDB } from "@/lib/mongodb";
import { monthNames, monthNumberFromName } from "@/lib/month-utils";
import Notice from "@/models/Notice";
import Payment from "@/models/Payment";
import Student from "@/models/Student";
import User from "@/models/User";
import { buildWeeklyRoutineFromBatch, routineDayPairs } from "@/lib/routine-utils";

const staffRoles = ["manager", "admin", "super_admin"];

type DashboardSubject = {
  subjectName?: string;
  teacher?: { name?: string } | null;
  days?: string[];
  startTime?: string;
  endTime?: string;
};

type DashboardStudent = {
  _id: unknown;
  classLevel?: number;
  batch?: { _id?: unknown; subjects?: DashboardSubject[]; routineNote?: string; title?: string; batchCode?: string } | null;
  selectedSubjects?: { subjectName?: string }[];
};

export const studentDays = routineDayPairs;

export const bnMonths = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

function phoneCandidates(phone?: string) {
  const normalized = phone ? normalizeBangladeshPhone(phone) : "";
  const intl = normalized.startsWith("0") ? `+880${normalized.slice(1)}` : "";
  const plainIntl = intl.replace("+", "");
  const localFromTenDigits = normalized.length === 10 && normalized.startsWith("1") ? `0${normalized}` : "";
  return [...new Set([phone, normalized, localFromTenDigits, intl, plainIntl].filter(Boolean))];
}

export function buildStudentRoutine(student: DashboardStudent) {
  return buildWeeklyRoutineFromBatch(student.batch?.subjects, (subject, day) => ({
    day: day.en,
    dayBn: day.bn,
    subjectName: String(subject.subjectName ?? "বিষয়"),
    teacherName: subject.teacher?.name ?? "শিক্ষক নির্ধারিত হয়নি",
    startTime: subject.startTime ?? "",
    endTime: subject.endTime ?? "",
  }));
}

async function findLinkedStudent(user: NonNullable<Awaited<ReturnType<typeof getCurrentAuthUser>>>) {
  if (user.linkedStudent) {
    const linkedStudent = await Student.findOne({ _id: user.linkedStudent, isActive: true })
      .populate({ path: "batch", populate: { path: "subjects.teacher", select: "name" } })
      .lean();

    if (linkedStudent) return linkedStudent;

    await User.findByIdAndUpdate(user.id, { linkedStudent: null });
  }

  const phones = phoneCandidates(user.phone);
  if (!phones.length) return { problem: "missing-phone" as const };

  const matches = await Student.find({
    isActive: true,
    $or: [
      { phone: { $in: phones } },
      { whatsapp: { $in: phones } },
      { guardianPhone: { $in: phones } },
    ],
  })
    .populate({ path: "batch", populate: { path: "subjects.teacher", select: "name" } })
    .limit(2)
    .lean();

  if (matches.length !== 1) return { problem: matches.length ? "multiple" : "not-found" as const };

  await User.findByIdAndUpdate(user.id, { linkedStudent: matches[0]._id });
  return matches[0];
}

export const getStudentContext = cache(async () => {
  const user = await getCurrentAuthUser();
  if (!user) redirect("/login");
  if (staffRoles.includes(user.role)) redirect("/admin");

  await connectDB();
  const student = await findLinkedStudent(user);
  if (!student || "problem" in student) {
    return { user, problem: student?.problem ?? ("not-found" as const) };
  }

  return {
    user,
    student: JSON.parse(JSON.stringify(student)),
  };
});

function noticeTargetsForStudent(student: DashboardStudent) {
  const targets: Record<string, unknown>[] = [
    { audience: "all" },
    { audience: "class", classLevel: student.classLevel },
    { audience: "student", student: normalizeObjectId(student._id) ?? student._id },
  ];

  const batchId = normalizeObjectId(student.batch?._id ?? student.batch);
  if (batchId) {
    targets.push({ audience: "batch", batch: batchId });
  }

  return targets;
}

export async function getStudentNotices(limit = 20) {
  const ctx = await getStudentContext();
  if ("problem" in ctx) {
    return { user: ctx.user, problem: ctx.problem };
  }

  const notices = await Notice.find({
    isPublished: true,
    $or: noticeTargetsForStudent(ctx.student),
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return {
    user: ctx.user,
    student: ctx.student,
    notices: JSON.parse(JSON.stringify(notices)),
  };
}

export async function getStudentDashboardData() {
  const ctx = await getStudentContext();
  if ("problem" in ctx) {
    return { user: ctx.user, problem: ctx.problem };
  }

  const now = new Date();
  await ensureAllBillingMonthsForStudent(String(ctx.student._id), now);

  const currentMonth = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();
  const currentMonthNumber = now.getMonth() + 1;
  const routine = buildStudentRoutine(ctx.student);
  const today = now.toLocaleDateString("en-US", { weekday: "long" });
  const todayClasses = routine.filter((item) => item.day === today);

  const rawPayments = await Payment.find({ student: ctx.student._id })
    .sort({ year: -1, monthNumber: -1, createdAt: -1 })
    .lean();

  const payments = JSON.parse(JSON.stringify(rawPayments)).filter(
    (payment: { month?: string; monthNumber?: number; year?: number }) => {
      const monthNumber = payment.monthNumber || monthNumberFromName(payment.month || "");
      if (!monthNumber || !payment.year) return false;
      return shouldShowStudentBillingMonth(ctx.student, monthNumber, payment.year, now);
    }
  );

  const payment =
    payments.find(
      (item: { monthNumber?: number; year?: number }) =>
        item.monthNumber === currentMonthNumber && item.year === currentYear
    ) ?? null;

  const totalDue = payments.reduce(
    (sum: number, item: { dueAmount?: number }) => sum + Math.max(0, Number(item.dueAmount) || 0),
    0
  );
  const overdueCount = payments.filter((item: { dueAmount?: number; monthNumber?: number; year?: number }) => {
    const due = Math.max(0, Number(item.dueAmount) || 0);
    if (due <= 0) return false;
    if (item.year! < currentYear) return true;
    if (item.year === currentYear && (item.monthNumber || 0) < currentMonthNumber) return true;
    return false;
  }).length;

  const notices = await Notice.find({
    isPublished: true,
    $or: noticeTargetsForStudent(ctx.student),
  })
    .sort({ publishedAt: -1 })
    .limit(6)
    .lean();

  return {
    user: ctx.user,
    student: ctx.student,
    routine,
    todayClasses,
    payment,
    payments,
    totalDue,
    overdueCount,
    notices: JSON.parse(JSON.stringify(notices)),
    currentMonthBn: bnMonths[now.getMonth()],
    currentMonth,
    currentYear,
  };
}

export async function getStudentPaymentLedger() {
  const ctx = await getStudentContext();
  if ("problem" in ctx) {
    return { user: ctx.user, problem: ctx.problem };
  }

  const now = new Date();
  await ensureAllBillingMonthsForStudent(String(ctx.student._id), now);

  const rawPayments = await Payment.find({ student: ctx.student._id })
    .sort({ year: -1, monthNumber: -1, createdAt: -1 })
    .lean();

  const payments = JSON.parse(JSON.stringify(rawPayments)).filter(
    (payment: { month?: string; monthNumber?: number; year?: number }) => {
      const monthNumber = payment.monthNumber || monthNumberFromName(payment.month || "");
      if (!monthNumber || !payment.year) return false;
      return shouldShowStudentBillingMonth(ctx.student, monthNumber, payment.year, now);
    }
  );

  const currentMonthNumber = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const totalDue = payments.reduce(
    (sum: number, item: { dueAmount?: number }) => sum + Math.max(0, Number(item.dueAmount) || 0),
    0
  );
  const overdueCount = payments.filter((item: { dueAmount?: number; monthNumber?: number; year?: number }) => {
    const due = Math.max(0, Number(item.dueAmount) || 0);
    if (due <= 0) return false;
    if (item.year! < currentYear) return true;
    if (item.year === currentYear && (item.monthNumber || 0) < currentMonthNumber) return true;
    return false;
  }).length;

  return {
    user: ctx.user,
    student: ctx.student,
    payments,
    totalDue,
    overdueCount,
    currentMonthBn: bnMonths[now.getMonth()],
    currentYear,
  };
}

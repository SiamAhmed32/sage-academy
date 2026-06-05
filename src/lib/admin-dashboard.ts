import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";
import AdmissionRequest from "@/models/AdmissionRequest";
import ContactRequest from "@/models/ContactRequest";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import FreeClassLead from "@/models/FreeClassLead";
import Payment from "@/models/Payment";
import QuizSubmission from "@/models/QuizSubmission";
import AssessmentRegistration from "@/models/AssessmentRegistration";
import { getEngagementAnalytics } from "@/lib/engagement-analytics-server";
import type { DashboardClass, DashboardLead } from "@/components/admin/dashboard/types";
import { getRoutineDayValues, type RoutineDay } from "@/lib/admin-routine";
import { monthNames } from "@/lib/month-utils";

const DAYS = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
] as RoutineDay[];

type LeanAdmissionRow = {
  _id: { toString(): string };
  studentName?: string;
  phone?: string;
  className?: string;
  status?: string;
  createdAt: Date | string;
};

type LeanContactRow = {
  _id: { toString(): string };
  name?: string;
  phone?: string;
  status?: string;
  createdAt: Date | string;
};

type LeanFreeClassRow = {
  _id: { toString(): string };
  name?: string;
  phone?: string;
  classLabel?: string;
  subject?: string;
  status?: string;
  createdAt: Date | string;
};

type LeanAssessmentRow = {
  _id: { toString(): string };
  name?: string;
  phone?: string;
  classLabel?: string;
  status?: string;
  createdAt: Date | string;
};

type LeanQuizRow = {
  _id: { toString(): string };
  name?: string;
  phone?: string;
  classLevel?: number;
  status?: string;
  createdAt: Date | string;
};

type LeanSubject = {
  days?: string[];
  subjectName?: string;
  startTime?: string;
  endTime?: string;
};

type LeanBatchRow = {
  _id: { toString(): string };
  title?: string;
  subjects?: LeanSubject[];
};

export const DASHBOARD_ENGAGEMENT_DAYS = 7;

export async function getAdminDashboardData() {
  await connectDB();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = DAYS[new Date().getDay()];
  const todayValues = getRoutineDayValues(today);

  const now = new Date();
  const currentMonthNumber = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Create last 6 months trend filter
  const trendMonths: { monthNumber: number; year: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); // avoid month overflow issues
    d.setMonth(d.getMonth() - i);
    const mn = d.getMonth() + 1;
    const yr = d.getFullYear();
    trendMonths.push({
      monthNumber: mn,
      year: yr,
      label: `${monthNames[d.getMonth()].slice(0, 3)} ${yr % 100}`,
    });
  }

  const [
    totalAdmissions,
    activeBatches,
    totalStudents,
    totalTeachers,
    newTodayAdmissions,
    newTodayContacts,
    recentAdmissions,
    recentContacts,
    todayBatches,
    funnelNew,
    funnelContacted,
    funnelQualified,
    engagementAnalytics,
    newTodayFreeClass,
    recentFreeClass,
    totalFreeClassLeads,
    // New aggregates:
    newTodayAssessments,
    newTodayQuizzes,
    totalAssessments,
    totalQuizzes,
    recentAssessments,
    recentQuizzes,
    financialSummary,
    trendsAgg,
    versionStats,
    classStats,
  ] = await Promise.all([
    AdmissionRequest.countDocuments(),
    AcademicBatch.countDocuments({ isActive: true, isArchived: { $ne: true } }),
    Student.countDocuments({ isActive: true }),
    Teacher.countDocuments(),
    AdmissionRequest.countDocuments({ createdAt: { $gte: startOfToday }, status: "new" }),
    ContactRequest.countDocuments({ createdAt: { $gte: startOfToday }, status: "new" }),
    AdmissionRequest.find().sort({ createdAt: -1 }).limit(6).lean<LeanAdmissionRow[]>(),
    ContactRequest.find().sort({ createdAt: -1 }).limit(6).lean<LeanContactRow[]>(),
    AcademicBatch.find({
      isActive: true,
      isArchived: { $ne: true },
      "subjects.days": { $in: todayValues },
    }).lean<LeanBatchRow[]>(),
    AdmissionRequest.countDocuments({ status: "new" }),
    AdmissionRequest.countDocuments({ status: "contacted" }),
    AdmissionRequest.countDocuments({ status: "qualified" }),
    getEngagementAnalytics(DASHBOARD_ENGAGEMENT_DAYS),
    FreeClassLead.countDocuments({ createdAt: { $gte: startOfToday }, status: "new" }),
    FreeClassLead.find().sort({ createdAt: -1 }).limit(6).lean<LeanFreeClassRow[]>(),
    FreeClassLead.countDocuments(),
    // Assessment query
    AssessmentRegistration.countDocuments({ createdAt: { $gte: startOfToday }, status: "new" }),
    // Quiz query
    QuizSubmission.countDocuments({ createdAt: { $gte: startOfToday }, status: "new" }),
    // Total New Assessments
    AssessmentRegistration.countDocuments({ status: "new" }),
    // Total New Quizzes
    QuizSubmission.countDocuments({ status: "new" }),
    // Recent Assessments
    AssessmentRegistration.find().sort({ createdAt: -1 }).limit(6).lean<LeanAssessmentRow[]>(),
    // Recent Quizzes
    QuizSubmission.find().sort({ createdAt: -1 }).limit(6).lean<LeanQuizRow[]>(),
    // Financial Aggregate for current month & year
    Payment.aggregate<{ expected: number; collected: number; due: number }>([
      { $match: { year: currentYear, monthNumber: currentMonthNumber } },
      {
        $group: {
          _id: null,
          expected: { $sum: { $ifNull: ["$expectedAmount", 0] } },
          collected: { $sum: { $ifNull: ["$amount", 0] } },
          due: { $sum: { $ifNull: ["$dueAmount", 0] } },
        },
      },
    ]),
    // Collection trend over last 6 months
    Payment.aggregate<{ _id: { monthNumber: number; year: number }; collected: number; expected: number }>([
      {
        $match: {
          $or: trendMonths.map(({ monthNumber, year }) => ({ monthNumber, year })),
        },
      },
      {
        $group: {
          _id: { monthNumber: "$monthNumber", year: "$year" },
          collected: { $sum: { $ifNull: ["$amount", 0] } },
          expected: { $sum: { $ifNull: ["$expectedAmount", 0] } },
        },
      },
    ]),
    // Version statistics
    Student.aggregate<{ _id: string; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: "$version", count: { $sum: 1 } } },
    ]),
    // Class statistics
    Student.aggregate<{ _id: number; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: "$classLevel", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Combine and sort leads
  const leads: DashboardLead[] = [
    ...recentAdmissions.map((item) => ({
      id: item._id.toString(),
      name: item.studentName ?? "",
      phone: item.phone ?? "",
      className: item.className ?? "",
      source: "Admission" as const,
      status: item.status ?? "new",
      time: new Date(item.createdAt).toLocaleTimeString("bn-BD", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(item.createdAt).getTime(),
      type: "admission" as const,
    })),
    ...recentContacts.map((item) => ({
      id: item._id.toString(),
      name: item.name ?? "",
      phone: item.phone ?? "",
      className: "",
      source: "Contact" as const,
      status: item.status ?? "new",
      time: new Date(item.createdAt).toLocaleTimeString("bn-BD", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(item.createdAt).getTime(),
      type: "contact" as const,
    })),
    ...recentFreeClass.map((item) => ({
      id: item._id.toString(),
      name: item.name ?? "",
      phone: item.phone ?? "",
      className: [item.classLabel, item.subject].filter(Boolean).join(" · ") || "",
      source: "Free class" as const,
      status: item.status ?? "new",
      time: new Date(item.createdAt).toLocaleTimeString("bn-BD", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(item.createdAt).getTime(),
      type: "free_class" as const,
    })),
    ...recentAssessments.map((item) => ({
      id: item._id.toString(),
      name: item.name ?? "",
      phone: item.phone ?? "",
      className: item.classLabel ?? "",
      source: "Assessment" as const,
      status: item.status ?? "new",
      time: new Date(item.createdAt).toLocaleTimeString("bn-BD", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(item.createdAt).getTime(),
      type: "assessment" as const,
    })),
    ...recentQuizzes.map((item) => ({
      id: item._id.toString(),
      name: item.name ?? "",
      phone: item.phone ?? "",
      className: item.classLevel ? `${item.classLevel} শ্রেণি` : "",
      source: "Quiz" as const,
      status: item.status ?? "new",
      time: new Date(item.createdAt).toLocaleTimeString("bn-BD", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(item.createdAt).getTime(),
      type: "quiz" as const,
    })),
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);

  const classes: DashboardClass[] = todayBatches.flatMap((batch) =>
    (batch.subjects ?? [])
      .filter((subject) =>
        (subject.days ?? []).some((subjectDay) => todayValues.includes(subjectDay))
      )
      .map((subject) => ({
        id: `${batch._id.toString()}-${subject.subjectName ?? "subject"}`,
        title: batch.title ?? "ব্যাচ",
        subject: subject.subjectName ?? "বিষয়",
        time: subject.startTime
          ? `${subject.startTime} - ${subject.endTime ?? ""}`.trim()
          : "সময় নির্ধারণ হয়নি",
      }))
  ).sort((a, b) => a.time.localeCompare(b.time));

  // Map financial data
  const financials = financialSummary[0] || { expected: 0, collected: 0, due: 0 };

  const collectionTrend = trendMonths.map((m) => {
    const matched = trendsAgg.find(
      (row) => row._id.monthNumber === m.monthNumber && row._id.year === m.year
    );
    return {
      label: m.label,
      collected: matched ? matched.collected : 0,
      expected: matched ? matched.expected : 0,
    };
  });

  // Map demographics
  const versionDistribution = {
    bangla: versionStats.find((v) => v._id === "bangla")?.count ?? 0,
    english: versionStats.find((v) => v._id === "english")?.count ?? 0,
    other: versionStats.find((v) => v._id === "other")?.count ?? 0,
  };

  const classDistribution = classStats.map((item) => ({
    classLevel: item._id,
    count: item.count,
  }));

  return {
    counts: {
      totalAdmissions,
      activeBatches,
      totalStudents,
      totalTeachers,
      newTodayLeads: newTodayAdmissions + newTodayContacts + newTodayFreeClass + newTodayAssessments + newTodayQuizzes,
      funnelNew,
      funnelContacted,
      funnelQualified,
      totalFreeClassLeads,
      totalAssessments,
      totalQuizzes,
    },
    leads,
    classes,
    financials,
    collectionTrend,
    demographics: {
      versionDistribution,
      classDistribution,
    },
    engagementAnalytics: JSON.parse(JSON.stringify(engagementAnalytics)) as typeof engagementAnalytics,
  };
}

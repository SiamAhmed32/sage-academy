import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";
import AdmissionRequest from "@/models/AdmissionRequest";
import ContactRequest from "@/models/ContactRequest";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import FreeClassLead from "@/models/FreeClassLead";
import { getEngagementAnalytics } from "@/lib/engagement-analytics-server";
import type { DashboardClass, DashboardLead } from "@/components/admin/dashboard/types";
import { getRoutineDayValues, type RoutineDay } from "@/lib/admin-routine";

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
  ]);

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
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);

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

  return {
    counts: {
      totalAdmissions,
      activeBatches,
      totalStudents,
      totalTeachers,
      newTodayLeads: newTodayAdmissions + newTodayContacts + newTodayFreeClass,
      funnelNew,
      funnelContacted,
      funnelQualified,
      totalFreeClassLeads,
    },
    leads,
    classes,
    engagementAnalytics: JSON.parse(JSON.stringify(engagementAnalytics)) as typeof engagementAnalytics,
  };
}

import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Gift,
  GraduationCap,
  Inbox,
  Users,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdmissionFunnel } from "@/components/admin/dashboard/AdmissionFunnel";
import { DashboardGuide } from "@/components/admin/dashboard/DashboardGuide";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";
import { DashboardMetricsGrid } from "@/components/admin/dashboard/DashboardMetricsGrid";
import { EngagementOverview } from "@/components/admin/dashboard/EngagementOverview";
import { LeadsTable } from "@/components/admin/dashboard/LeadsTable";
import { UpcomingClasses } from "@/components/admin/dashboard/UpcomingClasses";
import { FinancialOverview } from "@/components/admin/dashboard/FinancialOverview";
import { StudentDistribution } from "@/components/admin/dashboard/StudentDistribution";
import {
  DASHBOARD_ENGAGEMENT_DAYS,
  getAdminDashboardData,
} from "@/lib/admin-dashboard";
import type { DashboardMetric } from "@/components/admin/dashboard/types";

export default async function AdminDashboardPage() {
  const {
    counts,
    leads,
    classes,
    financials,
    collectionTrend,
    demographics,
    engagementAnalytics,
  } = await getAdminDashboardData();

  const metrics: DashboardMetric[] = [
    {
      title: "আজকের নতুন লিড",
      value: counts.newTodayLeads,
      note: "ভর্তি, যোগাযোগ, ফ্রি ক্লাস, টেস্ট ও কুইজ।",
      href: "/admin/free-class-leads?dateRange=today&status=new",
      icon: Inbox,
      urgent: counts.newTodayLeads > 0,
    },
    {
      title: "আজকের ক্লাস",
      value: classes.length,
      note: "আজ কোন কোন ব্যাচ সচল আছে।",
      href: "/admin/routine",
      icon: CalendarDays,
    },
    {
      title: "চলতি মাসের আদায়",
      value: `৳${financials.collected.toLocaleString("en-IN")}`,
      note: `সম্ভাব্য মোট: ৳${financials.expected.toLocaleString("en-IN")}`,
      href: "/admin/payments",
      icon: CreditCard,
    },
    {
      title: "সক্রিয় শিক্ষার্থী",
      value: counts.totalStudents,
      note: "একাডেমিতে মোট সচল শিক্ষার্থী।",
      href: "/admin/students",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="একাডেমি ড্যাশবোর্ড"
        description="আজ কী দেখবেন, কাকে আগে যোগাযোগ করবেন, আর পুরো একাডেমির অবস্থাটা কোথায় দাঁড়িয়ে আছে।"
      />

      <DashboardGuide />
      <QuickActions />
      <DashboardMetricsGrid metrics={metrics} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="space-y-6">
          <AdmissionFunnel
            counts={{
              new: counts.funnelNew,
              contacted: counts.funnelContacted,
              qualified: counts.funnelQualified,
              admitted: counts.totalStudents,
            }}
          />
          <FinancialOverview stats={financials} trend={collectionTrend} />
          <StudentDistribution demographics={demographics} />
          <LeadsTable leads={leads} />
        </div>

        <div className="space-y-6">
          <UpcomingClasses classes={classes} />
          <EngagementOverview
            analytics={engagementAnalytics}
            days={DASHBOARD_ENGAGEMENT_DAYS}
          />
          <section className="rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-lg font-bold text-sage-secondary">
              সিস্টেমের সারাংশ
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-sage-primary shrink-0" />
                <span>चलমান ব্যাচ: <strong>{counts.activeBatches}</strong></span>
              </p>
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-sage-primary shrink-0" />
                <span>শিক্ষক: <strong>{counts.totalTeachers}</strong></span>
              </p>
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                <Inbox className="h-5 w-5 text-sage-primary shrink-0" />
                <span>মোট ভর্তি আবেদন: <strong>{counts.totalAdmissions}</strong></span>
              </p>
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                <Gift className="h-5 w-5 text-sage-primary shrink-0" />
                <span>ফ্রি ক্লাস লিড: <strong>{counts.totalFreeClassLeads}</strong></span>
              </p>
              {counts.totalAssessments !== undefined && (
                <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                  <ClipboardCheck className="h-5 w-5 text-sage-primary shrink-0" />
                  <span>টেস্ট/Exam লিড: <strong>{counts.totalAssessments}</strong></span>
                </p>
              )}
              {counts.totalQuizzes !== undefined && (
                <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                  <Users className="h-5 w-5 text-sage-primary shrink-0" />
                  <span>কুইজ লিড (সর্বমোট): <strong>{counts.totalQuizzes}</strong></span>
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

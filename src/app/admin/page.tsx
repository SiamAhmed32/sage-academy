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
import { formatAdminCurrency } from "@/lib/admin-format";
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
      title: "New leads today",
      value: counts.newTodayLeads,
      note: "Admissions, contacts, free classes, tests, and quizzes.",
      href: "/admin/free-class-leads?dateRange=today&status=new",
      icon: Inbox,
      urgent: counts.newTodayLeads > 0,
    },
    {
      title: "Classes today",
      value: classes.length,
      note: "See which batches have classes today.",
      href: "/admin/routine",
      icon: CalendarDays,
    },
    {
      title: "Collected this month",
      value: formatAdminCurrency(financials.collected),
      note: `Expected total: ${formatAdminCurrency(financials.expected)}`,
      href: "/admin/payments",
      icon: CreditCard,
    },
    {
      title: "Active students",
      value: counts.totalStudents,
      note: "Total active students at the academy.",
      href: "/admin/students",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Academy Dashboard"
        description="See today's priorities, who to contact first, and the academy's overall status."
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
              System summary
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-sage-primary shrink-0" />
                <span>Active batches: <strong>{counts.activeBatches}</strong></span>
              </p>
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-sage-primary shrink-0" />
                <span>Teachers: <strong>{counts.totalTeachers}</strong></span>
              </p>
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                <Inbox className="h-5 w-5 text-sage-primary shrink-0" />
                <span>Total admission applications: <strong>{counts.totalAdmissions}</strong></span>
              </p>
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                <Gift className="h-5 w-5 text-sage-primary shrink-0" />
                <span>Free class leads: <strong>{counts.totalFreeClassLeads}</strong></span>
              </p>
              {counts.totalAssessments !== undefined && (
                <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                  <ClipboardCheck className="h-5 w-5 text-sage-primary shrink-0" />
                  <span>Test/exam leads: <strong>{counts.totalAssessments}</strong></span>
                </p>
              )}
              {counts.totalQuizzes !== undefined && (
                <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600 flex items-center gap-3">
                  <Users className="h-5 w-5 text-sage-primary shrink-0" />
                  <span>Total quiz leads: <strong>{counts.totalQuizzes}</strong></span>
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

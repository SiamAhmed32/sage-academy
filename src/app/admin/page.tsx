import {
  Activity,
  BookOpen,
  CalendarDays,
  Gift,
  GraduationCap,
  Inbox,
  Users,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdmissionFunnel } from "@/components/admin/dashboard/AdmissionFunnel";
import { DashboardGuide } from "@/components/admin/dashboard/DashboardGuide";
import { DashboardMetricsGrid } from "@/components/admin/dashboard/DashboardMetricsGrid";
import { EngagementOverview } from "@/components/admin/dashboard/EngagementOverview";
import { LeadsTable } from "@/components/admin/dashboard/LeadsTable";
import { UpcomingClasses } from "@/components/admin/dashboard/UpcomingClasses";
import {
  DASHBOARD_ENGAGEMENT_DAYS,
  getAdminDashboardData,
} from "@/lib/admin-dashboard";
import type { DashboardMetric } from "@/components/admin/dashboard/types";

export default async function AdminDashboardPage() {
  const { counts, leads, classes, engagementAnalytics } =
    await getAdminDashboardData();

  const metrics: DashboardMetric[] = [
    {
      title: "আজকের নতুন লিড",
      value: counts.newTodayLeads,
      note: "ভর্তি, যোগাযোগ ও ফ্রি ক্লাস—আজ ফলো-আপ লাগবে।",
      href: "/admin/free-class-leads?dateRange=today&status=new",
      icon: Inbox,
      urgent: counts.newTodayLeads > 0,
    },
    {
      title: "আজকের ক্লাস",
      value: classes.length,
      note: "আজ কোন ব্যাচ চলছে তা দেখুন।",
      href: "/admin/routine",
      icon: CalendarDays,
    },
    {
      title: "শেষ ৭ দিনের আগ্রহ",
      value: engagementAnalytics.totalInRange,
      note: "ভর্তি পেজ দেখা, ফর্ম শুরু বা বাটন ক্লিক।",
      href: "/admin/engagement",
      icon: Activity,
    },
    {
      title: "সক্রিয় শিক্ষার্থী",
      value: counts.totalStudents,
      note: "বর্তমানে সক্রিয় শিক্ষার্থীর সংখ্যা।",
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
          <EngagementOverview
            analytics={engagementAnalytics}
            days={DASHBOARD_ENGAGEMENT_DAYS}
          />
          <LeadsTable leads={leads} />
        </div>

        <div className="space-y-6">
          <UpcomingClasses classes={classes} />
          <section className="rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-lg font-bold text-sage-secondary">
              সিস্টেমের সারাংশ
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600">
                <BookOpen className="mb-2 h-5 w-5 text-sage-primary" />
                চলমান ব্যাচ: <strong>{counts.activeBatches}</strong>
              </p>
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600">
                <GraduationCap className="mb-2 h-5 w-5 text-sage-primary" />
                শিক্ষক: <strong>{counts.totalTeachers}</strong>
              </p>
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600">
                <Inbox className="mb-2 h-5 w-5 text-sage-primary" />
                মোট ভর্তি আবেদন: <strong>{counts.totalAdmissions}</strong>
              </p>
              <p className="rounded-lg bg-sage-red-50/50 p-3 text-sm text-sage-gray-600">
                <Gift className="mb-2 h-5 w-5 text-sage-primary" />
                ফ্রি ক্লাস লিড (সর্বমোট): <strong>{counts.totalFreeClassLeads}</strong>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

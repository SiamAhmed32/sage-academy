import { BellRing, CalendarDays, CreditCard } from "lucide-react";

import { StudentNoticeList } from "@/components/student/StudentNoticeList";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { StudentPaymentCard } from "@/components/student/StudentPaymentCard";
import { StudentQuickStats } from "@/components/student/StudentQuickStats";
import { StudentRoutineCard } from "@/components/student/StudentRoutineCard";
import { StudentTodayClassCard } from "@/components/student/StudentTodayClassCard";
import { getStudentDashboardData } from "@/lib/student-dashboard";

function paymentStatusLabel(payment?: { dueAmount?: number; amount?: number } | null, totalDue = 0, overdueCount = 0) {
  if (overdueCount > 0) return `${overdueCount} মাস বকেয়া`;
  if (!payment) return totalDue > 0 ? "বকেয়া আছে" : "রেকর্ড নেই";
  if ((payment.dueAmount || 0) <= 0 && (payment.amount || 0) > 0) return "পরিশোধিত";
  if ((payment.amount || 0) > 0) return "আংশিক";
  return "অপরিশোধিত";
}

export default async function StudentDashboardPage() {
  const data = await getStudentDashboardData();
  if ("problem" in data) return null;

  const displayName = data.student.nameBangla || data.student.nameEnglish;
  const paymentStatus = paymentStatusLabel(data.payment, data.totalDue, data.overdueCount);

  return (
    <div className="space-y-6">
      <StudentPageHeader
        title={`স্বাগতম, ${displayName}`}
        description="আজকের ক্লাস, পেমেন্ট ও গুরুত্বপূর্ণ নোটিশ এক নজরে দেখুন। বিস্তারিত জানতে বাম পাশের মেনু ব্যবহার করুন।"
      />

      <StudentQuickStats
        stats={[
          {
            label: "আজকের ক্লাস",
            value: `${data.todayClasses.length} টি`,
            note: data.todayClasses.length
              ? "আজ ক্লাস আছে — সময় মতো যোগ দিন।"
              : "আজ কোনো ক্লাস নেই।",
            href: "/student/routine",
            icon: CalendarDays,
          },
          {
            label: "এই মাসের পেমেন্ট",
            value: paymentStatus,
            note:
              data.overdueCount > 0
                ? `মোট বকেয়া ৳${data.totalDue.toLocaleString("bn-BD")} — বিস্তারিত দেখুন।`
                : `${data.currentMonthBn} ${data.currentYear} এর বিল স্ট্যাটাস।`,
            href: "/student/payments",
            icon: CreditCard,
            tone:
              paymentStatus === "পরিশোধিত"
                ? "success"
                : data.totalDue > 0 || paymentStatus === "অপরিশোধিত"
                  ? "warning"
                  : "default",
          },
          {
            label: "নতুন নোটিশ",
            value: `${data.notices.length} টি`,
            note: "ক্লাস, পরীক্ষা ও গুরুত্বপূর্ণ আপডেট।",
            href: "/student/notices",
            icon: BellRing,
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <StudentTodayClassCard classes={data.todayClasses} />
        <StudentPaymentCard
          payment={data.payment}
          month={data.currentMonthBn}
          year={data.currentYear}
          compact
          viewAllHref="/student/payments"
          totalDue={data.totalDue}
          overdueCount={data.overdueCount}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <StudentRoutineCard routine={data.routine} limit={4} viewAllHref="/student/routine" />
        <StudentNoticeList notices={data.notices} limit={3} viewAllHref="/student/notices" />
      </div>
    </div>
  );
}

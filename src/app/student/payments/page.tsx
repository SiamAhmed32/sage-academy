import { StudentPaymentLedger } from "@/components/student/StudentPaymentLedger";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { getStudentPaymentLedger } from "@/lib/student-dashboard";

export default async function StudentPaymentsPage() {
  const data = await getStudentPaymentLedger();
  if ("problem" in data) return null;

  return (
    <section className="space-y-5">
      <StudentPageHeader
        title="পেমেন্ট ও বিল"
        description="ভর্তির পর থেকে প্রতিটি মাসের বিল, জমা ও বকেয়া এখানে দেখুন।"
      />
      <StudentPaymentLedger
        payments={data.payments}
        totalDue={data.totalDue}
        overdueCount={data.overdueCount}
        currentMonthBn={data.currentMonthBn}
        currentYear={data.currentYear}
      />
    </section>
  );
}

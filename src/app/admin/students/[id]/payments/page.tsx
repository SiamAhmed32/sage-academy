import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StudentPaymentCenter } from "@/components/admin/students/profile/StudentPaymentCenter";
import { StudentPaymentFilters } from "@/components/admin/students/profile/StudentPaymentFilters";
import { paymentStatus } from "@/components/admin/students/profile/payment-history-utils";
import { subjectTotal } from "@/components/admin/students/profile/student-profile-utils";
import type { StudentProfile } from "@/components/admin/students/profile/types";
import {
  ensureAllBillingMonthsForStudent,
  shouldShowStudentBillingMonth,
} from "@/lib/billing";
import { monthNumberFromName } from "@/lib/month-utils";
import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Student from "@/models/Student";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
};

const statusOptions = ["all", "paid", "partial", "unpaid"];

export default async function StudentPaymentsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  await connectDB();

  const now = new Date();
  const currentYear = now.getFullYear();
  await ensureAllBillingMonthsForStudent(id, now);

  const [rawStudent, rawPayments] = await Promise.all([
    Student.findById(id).populate("batch").lean(),
    Payment.find({ student: id })
      .populate("student", "nameEnglish studentId")
      .populate("receivedBy", "name")
      .populate("transactions.receivedBy", "name")
      .populate("transactions.reversedBy", "name")
      .sort({ year: -1, monthNumber: -1, createdAt: -1 })
      .lean(),
  ]);

  if (!rawStudent) notFound();

  const student = JSON.parse(JSON.stringify(rawStudent)) as StudentProfile;
  const monthlyTotal = subjectTotal(student.selectedSubjects);
  const eligiblePayments = JSON.parse(JSON.stringify(rawPayments)).filter((payment: { month?: string; monthNumber?: number; year?: number; amount?: number }) => {
    const monthNumber = payment.monthNumber || monthNumberFromName(payment.month || "");
    if (!monthNumber || !payment.year) return true;
    return shouldShowStudentBillingMonth(student, monthNumber, payment.year, now);
  });

  const years = Array.from(new Set([currentYear, ...eligiblePayments.map((payment: { year: number }) => payment.year).filter(Boolean)]))
    .sort((a, b) => b - a);
  const selectedYear = Number(query.year) || currentYear;
  const selectedMonth = query.month || "all";
  const requestedStatus = query.status || "all";
  const selectedStatus = statusOptions.includes(requestedStatus) ? requestedStatus : "all";

  const payments = eligiblePayments.filter((payment: { month?: string; monthNumber?: number; year?: number; amount?: number; expectedAmount?: number }) => {
    if (payment.year !== selectedYear) return false;
    const paymentMonth = String(payment.monthNumber || monthNumberFromName(payment.month || ""));
    if (selectedMonth !== "all" && paymentMonth !== selectedMonth) return false;
    if (selectedStatus !== "all") {
      const expected = payment.expectedAmount || monthlyTotal;
      if (paymentStatus(payment.amount || 0, expected).toLowerCase() !== selectedStatus) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/students/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-sage-border bg-white text-sage-gray-500 shadow-sm transition hover:bg-sage-red-50 hover:text-sage-primary"
        >
          <ArrowLeft size={20} />
        </Link>
        <AdminPageHeader
          title={`${student.nameEnglish} - Payments`}
          description={`Student ID: ${student.studentId} · Monthly payable ৳${monthlyTotal}`}
        />
      </div>

      <StudentPaymentFilters
        years={years}
        year={String(selectedYear)}
        month={selectedMonth}
        status={selectedStatus || "all"}
      />

      <StudentPaymentCenter student={student} payments={payments} monthlyTotal={monthlyTotal} mode="full" />
    </div>
  );
}

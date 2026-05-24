import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StudentBillingSubjects } from "@/components/admin/students/profile/StudentBillingSubjects";
import { StudentGuardianPanel } from "@/components/admin/students/profile/StudentGuardianPanel";
import { StudentNotesPanel } from "@/components/admin/students/profile/StudentNotesPanel";
import { StudentPaymentCenter } from "@/components/admin/students/profile/StudentPaymentCenter";
import { StudentProfileHero } from "@/components/admin/students/profile/StudentProfileHero";
import { StudentQuickFacts } from "@/components/admin/students/profile/StudentQuickFacts";
import { StudentRoutinePreview } from "@/components/admin/students/profile/StudentRoutinePreview";
import { StudentSubjectHistory } from "@/components/admin/students/profile/StudentSubjectHistory";
import {
  ensureAllBillingMonthsForStudent,
  shouldShowStudentBillingMonth,
} from "@/lib/billing";
import { monthNumberFromName } from "@/lib/month-utils";
import {
  buildRoutine,
  subjectTotal,
} from "@/components/admin/students/profile/student-profile-utils";
import type { StudentProfile } from "@/components/admin/students/profile/types";
import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Student from "@/models/Student";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudentProfilePage({ params }: PageProps) {
  const { id } = await params;
  await connectDB();
  const now = new Date();
  await ensureAllBillingMonthsForStudent(id, now);

  const [rawStudent, rawPayments] = await Promise.all([
    Student.findById(id)
      .populate({ path: "batch", populate: { path: "subjects.teacher", select: "name" } })
      .lean(),
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
  const allPayments = JSON.parse(JSON.stringify(rawPayments));
  const payments = allPayments.filter((payment: { month?: string; monthNumber?: number; year?: number; amount?: number }) => {
    const monthNumber = payment.monthNumber || monthNumberFromName(payment.month || "");
    if (!monthNumber || !payment.year) return true;
    return shouldShowStudentBillingMonth(student, monthNumber, payment.year, now);
  });
  const routine = buildRoutine(student);
  const monthlyTotal = subjectTotal(student.selectedSubjects);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/students"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-sage-border bg-white text-sage-gray-500 shadow-sm transition hover:bg-sage-red-50 hover:text-sage-primary"
        >
          <ArrowLeft size={20} />
        </Link>
        <AdminPageHeader
          title={`${student.nameEnglish} - প্রোফাইল`}
          description={`Student ID: ${student.studentId} · Monthly payable ৳${monthlyTotal}`}
        />
      </div>

      <StudentProfileHero student={student} monthlyTotal={monthlyTotal} />
      <StudentQuickFacts student={student} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <StudentBillingSubjects student={student} />
        <StudentGuardianPanel student={student} />
      </div>

      <StudentPaymentCenter student={student} payments={payments} monthlyTotal={monthlyTotal} />
      <StudentRoutinePreview
        routine={routine}
        studentName={student.nameBangla || student.nameEnglish}
        studentNameEnglish={student.nameEnglish}
        studentId={student.studentId}
        batchTitle={student.batch?.title}
        batchCode={student.batch?.batchCode}
        classLevel={student.batch?.classLevel ?? student.classLevel}
        routineNote={student.batch?.routineNote}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <StudentSubjectHistory student={student} />
        <StudentNotesPanel note={student.note} />
      </div>
    </div>
  );
}

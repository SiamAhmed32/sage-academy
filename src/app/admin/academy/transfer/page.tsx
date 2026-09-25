import { Types } from "mongoose";

import { studentEnrollmentsAction, transferOptionsAction } from "@/app/admin/academy/_actions/students";
import { TransferTool, type TransferEnrollment, type TransferOption } from "@/components/admin/academy/TransferTool";
import { PageHeading } from "@/components/admin/sa/ui";
import { searchStudentsLite } from "@/lib/academy/queries";
import { connectDB } from "@/lib/mongodb";
import AcademyStudent from "@/models/academy/AcademyStudent";

export default async function TransferPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; enrollment?: string }>;
}) {
  const params = await searchParams;
  let initial = null;
  let enrollments: TransferEnrollment[] = [];
  let options: TransferOption[] | null = null;

  if (params.student && Types.ObjectId.isValid(params.student)) {
    await connectDB();
    const student = await AcademyStudent.findById(params.student).select("studentId").lean<{ studentId: string }>();
    if (student) {
      initial = (await searchStudentsLite(student.studentId, 1))[0] ?? null;
      const result = await studentEnrollmentsAction(params.student);
      enrollments = result.ok ? result.data ?? [] : [];
    }
  }
  const enrollment = enrollments.some((row) => row.enrollmentId === params.enrollment) ? params.enrollment ?? "" : "";
  if (enrollment) {
    const result = await transferOptionsAction(enrollment);
    options = result.ok ? result.data ?? [] : [];
  }

  return (
    <div>
      <PageHeading
        eyebrow="Students"
        title="Transfer subject"
        description="Move one of a student's subjects to another batch — for example Physics from 09BB01 to 09BB02. Seats and timetable clashes are checked first."
        back={initial ? { href: `/admin/academy/students/${initial.id}`, label: initial.name } : undefined}
      />
      <TransferTool
        key={`${initial?.id ?? "none"}-${enrollment}`}
        initialStudent={initial}
        initialEnrollments={enrollments}
        initialEnrollment={enrollment}
        initialOptions={options}
      />
    </div>
  );
}

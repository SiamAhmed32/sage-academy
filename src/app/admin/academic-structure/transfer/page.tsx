import { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import { TransferStudentForm } from "@/components/admin/academic-structure/TransferStudentForm";
import type { StudentRow } from "@/components/admin/academic-structure/types";

export const metadata: Metadata = { title: "Transfer Subject Batch | SAGE Admin" };
export const dynamic = "force-dynamic";

export default async function TransferPage() {
  await connectDB();
  const students = await Student.find({ isActive: true, classId: { $ne: null } })
    .select("studentId nameEnglish")
    .sort({ nameEnglish: 1 })
    .lean();
  const studentRows: StudentRow[] = JSON.parse(JSON.stringify(students));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Transfer Subject Batch"
        description="Move a student from one subject's batch section to another (e.g. Physics Batch 1 → Batch 2). Blocked with a clear message if the target section is already full."
      />

      {studentRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sage-border bg-white p-6 text-sm text-sage-gray-500">
          No students admitted through the new admission screen yet. Admit a student first.
        </div>
      ) : (
        <TransferStudentForm students={studentRows} />
      )}
    </div>
  );
}

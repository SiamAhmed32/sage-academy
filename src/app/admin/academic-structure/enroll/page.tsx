import { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import SubjectBatch from "@/models/SubjectBatch";
import Enrollment from "@/models/Enrollment";
import { EnrollStudentForm } from "@/components/admin/academic-structure/EnrollStudentForm";
import type { StudentRow, SubjectBatchRow } from "@/components/admin/academic-structure/types";

export const metadata: Metadata = { title: "Enroll Student | SAGE Admin" };
export const dynamic = "force-dynamic";

export default async function EnrollStudentPage() {
  await connectDB();

  const students = await Student.find({ isActive: true })
    .select("studentId nameEnglish classLevel")
    .sort({ nameEnglish: 1 })
    .lean();

  const slots = await SubjectBatch.find({ isActive: true })
    .populate("subjectId", "name")
    .populate("batchGroupId", "name")
    .sort({ createdAt: 1 })
    .lean();

  const slotIds = slots.map((s) => s._id);
  const seatCounts: Array<{ _id: string; count: number }> = slotIds.length
    ? await Enrollment.aggregate([
        { $match: { subjectBatchId: { $in: slotIds }, status: "ACTIVE" } },
        { $group: { _id: "$subjectBatchId", count: { $sum: 1 } } },
      ])
    : [];
  const seatMap = new Map(seatCounts.map((s) => [String(s._id), s.count]));

  const studentRows: StudentRow[] = JSON.parse(JSON.stringify(students));
  const slotRows: SubjectBatchRow[] = JSON.parse(JSON.stringify(slots));
  const seatMapObj = Object.fromEntries(seatMap.entries());

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Enroll Student"
        description="Enroll a student into specific subject slots (not a whole batch group). If a slot is full, the student is automatically rolled over to the next open section for that subject."
      />

      {studentRows.length === 0 || slotRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sage-border bg-white p-6 text-sm text-sage-gray-500">
          You need at least one active student and one subject batch slot before enrolling.
        </div>
      ) : (
        <EnrollStudentForm students={studentRows} slots={slotRows} seatMap={seatMapObj} />
      )}
    </div>
  );
}

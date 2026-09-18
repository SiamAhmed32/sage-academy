import { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Teacher from "@/models/Teacher";
import { CreateBatchForm } from "@/components/admin/academic-structure/CreateBatchForm";
import type { ClassRow } from "@/components/admin/academic-structure/types";

export const metadata: Metadata = { title: "Create Batch | SAGE Admin" };
export const dynamic = "force-dynamic";

type TeacherOption = { _id: string; name: string };

export default async function CreateBatchPage() {
  await connectDB();
  const classes = await Class.find({ isActive: true }).sort({ orderIndex: 1, name: 1 }).lean();
  const teachers = await Teacher.find().sort({ name: 1 }).lean();

  const classRows: ClassRow[] = JSON.parse(JSON.stringify(classes));
  const teacherRows: TeacherOption[] = JSON.parse(JSON.stringify(teachers));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Create Batch"
        description="One screen: pick the class, medium, gender and batch name — the subjects for that class load automatically below. Set seats, fee, teacher and weekly routine per subject, then save once."
      />

      {classRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sage-border bg-white p-6 text-sm text-sage-gray-500">
          Create a class (and its subjects) first under Academic Structure → Classes / Subjects.
        </div>
      ) : (
        <CreateBatchForm classes={classRows} teachers={teacherRows} />
      )}
    </div>
  );
}

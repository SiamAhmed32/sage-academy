import { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Subject from "@/models/Subject";
import { SubjectsManager } from "@/components/admin/academic-structure/SubjectsManager";
import type { ClassRow, SubjectRow } from "@/components/admin/academic-structure/types";

export const metadata: Metadata = { title: "Subjects | SAGE Admin" };
export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  await connectDB();
  const classes = await Class.find().sort({ orderIndex: 1, name: 1 }).lean();
  const subjects = await Subject.find().populate("classId", "name").sort({ name: 1 }).lean();

  const classRows: ClassRow[] = JSON.parse(JSON.stringify(classes));
  const subjectRows: SubjectRow[] = JSON.parse(JSON.stringify(subjects));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Subjects"
        description="Each subject belongs to exactly one class and holds its own base monthly fee — defined once instead of retyped inside every batch. Grouped by class below so it stays readable as more subjects are added."
      />

      {classRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sage-border bg-white p-6 text-sm text-sage-gray-500">
          Create a class first before adding subjects.
        </div>
      ) : (
        <SubjectsManager classes={classRows} subjects={subjectRows} />
      )}
    </div>
  );
}

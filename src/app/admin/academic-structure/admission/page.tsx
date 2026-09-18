import { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import { AdmissionForm } from "@/components/admin/academic-structure/AdmissionForm";
import type { ClassRow } from "@/components/admin/academic-structure/types";

export const metadata: Metadata = { title: "New Admission | SAGE Admin" };
export const dynamic = "force-dynamic";

export default async function NewAdmissionPage() {
  await connectDB();
  const classes = await Class.find({ isActive: true }).sort({ orderIndex: 1, name: 1 }).lean();
  const classRows: ClassRow[] = JSON.parse(JSON.stringify(classes));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="New Admission"
        description="One screen: student details, then pick exactly the subjects they're taking with live seat counts, see the fee total update as you go, and save to create the student, enroll them and generate their first invoice together."
      />

      {classRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sage-border bg-white p-6 text-sm text-sage-gray-500">
          Create a class and at least one batch first under Academic Structure.
        </div>
      ) : (
        <AdmissionForm classes={classRows} />
      )}
    </div>
  );
}

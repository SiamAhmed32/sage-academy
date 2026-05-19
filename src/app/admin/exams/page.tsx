import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AssessmentManager } from "@/components/admin/assessments/AssessmentManager";
import { connectDB } from "@/lib/mongodb";
import Exam from "@/models/Exam";

export default async function AdminExamsPage() {
  await connectDB();
  const items = await Exam.find().sort({ order: 1, createdAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Exam"
        description="Half Yearly, Pre-Test, Final, Board Prep ও নিয়মিত exam আলাদা মডিউল হিসেবে পরিচালনা করুন।"
      />
      <AssessmentManager type="exam" items={JSON.parse(JSON.stringify(items))} />
    </div>
  );
}

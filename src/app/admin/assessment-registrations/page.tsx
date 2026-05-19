import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AssessmentRegistrationTable } from "@/components/admin/assessments/AssessmentRegistrationTable";
import { connectDB } from "@/lib/mongodb";
import AssessmentRegistration from "@/models/AssessmentRegistration";

export default async function AdminAssessmentRegistrationsPage() {
  await connectDB();
  const items = await AssessmentRegistration.find().sort({ createdAt: -1 }).limit(500).lean();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="মডেল টেস্ট / Exam রেজিস্ট্রেশন"
        description="মডেল টেস্ট ও exam রেজিস্ট্রেশন আলাদা লিড হিসেবে ফলোআপ করুন।"
      />
      <AssessmentRegistrationTable initialItems={JSON.parse(JSON.stringify(items))} />
    </div>
  );
}

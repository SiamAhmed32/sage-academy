import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AssessmentManager } from "@/components/admin/assessments/AssessmentManager";
import { connectDB } from "@/lib/mongodb";
import ModelTest from "@/models/ModelTest";

export default async function AdminModelTestsPage() {
  await connectDB();
  const items = await ModelTest.find().sort({ order: 1, createdAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="মডেল টেস্ট"
        description="ক্লাস, বিষয়, স্কুল ফোকাস, ফি এবং Solve Class সহ সময়ভিত্তিক মডেল টেস্ট পরিচালনা করুন।"
      />
      <AssessmentManager type="modelTest" items={JSON.parse(JSON.stringify(items))} />
    </div>
  );
}

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import QuizSubmission from "@/models/QuizSubmission";
import { QuizLeadTable } from "@/components/admin/quizzes/QuizLeadTable";

export default async function AdminQuizLeadsPage() {
  await connectDB();
  
  const leads = await QuizSubmission.find()
    .populate("answers.question", "questionText explanation")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="কুইজ লিড ম্যানেজমেন্ট"
        description="কুইজে অংশগ্রহণকারী শিক্ষার্থীদের তথ্য এবং ফলাফল দেখুন।"
      />
      <QuizLeadTable initialLeads={JSON.parse(JSON.stringify(leads))} />
    </div>
  );
}

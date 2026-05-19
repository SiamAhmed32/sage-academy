import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import QuizQuestion from "@/models/QuizQuestion";
import { QuizManager } from "@/components/admin/quizzes/QuizManager";

export default async function AdminQuizzesPage() {
  await connectDB();
  const questions = await QuizQuestion.find().sort({ classLevel: 1, order: 1 }).lean();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="কুইজ ম্যানেজমেন্ট"
        description="শিক্ষার্থীদের জন্য কুইজ প্রশ্ন এবং সমাধান যোগ করুন।"
      />
      <QuizManager initialQuestions={JSON.parse(JSON.stringify(questions))} />
    </div>
  );
}

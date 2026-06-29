import { StudentExamResultsList } from "@/components/student/StudentExamResultsList";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { getExamResultsForPhone } from "@/lib/exam-hub-student";
import { getStudentContext } from "@/lib/student-dashboard";

export default async function StudentResultsPage() {
  const ctx = await getStudentContext();
  if ("problem" in ctx) {
    return (
      <section className="space-y-6">
        <StudentPageHeader title="ফলাফল" description="পরীক্ষার ফলাফল দেখতে শিক্ষার্থী প্রোফাইল লিংক প্রয়োজন।" />
        <StudentExamResultsList results={[]} />
      </section>
    );
  }

  const phone = String(ctx.student.phone || ctx.user.phone || "");
  const results = phone ? await getExamResultsForPhone(phone) : [];

  return (
    <section className="space-y-6">
      <StudentPageHeader
        title="ফলাফল"
        description="Exam Hub অনলাইন MCQ ও ভবিষ্যৎ একাডেমিক পরীক্ষার ফলাফল এক জায়গায়।"
      />
      <StudentExamResultsList results={results} phone={phone || undefined} />
    </section>
  );
}

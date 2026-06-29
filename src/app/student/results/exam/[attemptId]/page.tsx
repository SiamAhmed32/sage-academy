import Link from "next/link";
import { notFound } from "next/navigation";

import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { Button } from "@/components/ui/button";
import { sanitizePhone } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import { getStudentContext } from "@/lib/student-dashboard";
import ExamAttempt from "@/models/ExamAttempt";
import ExamProgram from "@/models/ExamProgram";

type Props = { params: Promise<{ attemptId: string }> };

export default async function StudentExamResultDetailPage({ params }: Props) {
  const ctx = await getStudentContext();
  if ("problem" in ctx) notFound();

  const phone = sanitizePhone(String(ctx.student.phone || ctx.user.phone || ""));
  if (!phone) notFound();

  const { attemptId } = await params;
  await connectDB();

  const attempt = await ExamAttempt.findOne({ _id: attemptId, phone, status: "submitted" }).lean();
  if (!attempt) notFound();

  const program = await ExamProgram.findById(attempt.programId).lean();
  const pct = attempt.totalMarks ? Math.round((Number(attempt.score) / Number(attempt.totalMarks)) * 100) : 0;

  return (
    <section className="space-y-6">
      <StudentPageHeader title="পরীক্ষার ফলাফল" description={program?.title || "Exam Hub"} />
      <div className="rounded-xl border border-sage-border bg-white p-6 text-center shadow-sm">
        <p className="text-4xl font-black text-sage-primary">
          {attempt.score}/{attempt.totalMarks}
        </p>
        <p className="mt-2 font-semibold text-sage-secondary">{pct}%</p>
        <p className="mt-2 text-sm text-sage-gray-500">
          সময়: {Math.floor(Number(attempt.durationSeconds || 0) / 60)}m {Number(attempt.durationSeconds || 0) % 60}s
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {program?.slug ? (
            <Button asChild variant="outline">
              <Link href={`/exams/${program.slug}/leaderboard`}>Leaderboard</Link>
            </Button>
          ) : null}
          <Button asChild>
            <Link href="/student/results">সব ফলাফল</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

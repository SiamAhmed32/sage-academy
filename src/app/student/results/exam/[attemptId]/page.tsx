import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";

import { MiniStat, MiniStats, PageHeading } from "@/components/admin/sa/ui";
import { formatDate } from "@/lib/academy/codes";
import { getPortalStudent } from "@/lib/academy/portal";
import { sanitizePhone } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import ExamAttempt from "@/models/ExamAttempt";
import ExamProgram from "@/models/ExamProgram";

type Props = { params: Promise<{ attemptId: string }> };

export default async function StudentExamResultDetailPage({ params }: Props) {
  const { ctx, detail } = await getPortalStudent();
  if (!detail) return null;
  const phones = [ctx.user.phone ?? "", detail.student.phone, detail.student.whatsapp].map((phone) => sanitizePhone(phone)).filter(Boolean);
  if (phones.length === 0) notFound();

  const { attemptId } = await params;
  await connectDB();
  const attempt = await ExamAttempt.findOne({ _id: attemptId, phone: { $in: phones }, status: "submitted" }).lean();
  if (!attempt) notFound();
  const program = await ExamProgram.findById(attempt.programId).lean();
  const pct = attempt.totalMarks ? Math.round((Number(attempt.score) / Number(attempt.totalMarks)) * 100) : 0;
  const seconds = Number(attempt.durationSeconds || 0);

  return (
    <div>
      <PageHeading
        eyebrow="Student workspace"
        title={program?.title || "পরীক্ষার ফলাফল"}
        description={attempt.submittedAt ? `জমা: ${formatDate(attempt.submittedAt as Date)}` : undefined}
        back={{ href: "/student/results", label: "সব ফলাফল" }}
        actions={
          program?.slug ? (
            <Link href={`/exams/${program.slug}/leaderboard`} className="btn-primary">
              <Trophy size={17} /> লিডারবোর্ড
            </Link>
          ) : null
        }
      />
      <MiniStats>
        <MiniStat label="নম্বর" value={`${attempt.score}/${attempt.totalMarks}`} note="প্রাপ্ত নম্বর" />
        <MiniStat label="শতাংশ" value={`${pct}%`} note={pct >= 80 ? "চমৎকার!" : pct >= 50 ? "ভালো" : "আরও চেষ্টা করো"} />
        <MiniStat label="সময়" value={`${Math.floor(seconds / 60)}m ${seconds % 60}s`} note="মোট সময়" />
      </MiniStats>
    </div>
  );
}

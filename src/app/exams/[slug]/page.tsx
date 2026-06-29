import { notFound } from "next/navigation";

import { ExamDetailClient } from "@/components/exam-hub/ExamDetailClient";
import { activeExamQuestionQuery, serializePublicProgram } from "@/lib/exam-hub";
import { getCurrentAuthUser } from "@/lib/auth-session";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  await connectDB();
  const { slug } = await params;
  const program = await ExamProgram.findOne({ slug, status: "published" }).select("title subtitle").lean();
  return {
    title: program ? `${program.title} | SAGE Exam Hub` : "Exam | SAGE Academy",
    description: program?.subtitle || "Exam details and registration",
  };
}

export default async function ExamDetailPage({ params }: Props) {
  await connectDB();
  const { slug } = await params;
  const program = await ExamProgram.findOne({ slug, status: "published" }).lean();
  if (!program) notFound();

  const questionCount = await ExamQuestion.countDocuments(activeExamQuestionQuery(program._id));
  const user = await getCurrentAuthUser();

  return (
    <ExamDetailClient
      isLoggedIn={Boolean(user)}
      userPhone={user?.phone || ""}
      program={serializePublicProgram({
        ...(program as Record<string, unknown>),
        questionCount,
      })}
    />
  );
}

import { notFound } from "next/navigation";

import { ExamDetailClient } from "@/components/exam-hub/ExamDetailClient";
import { activeExamQuestionQuery } from "@/lib/exam-hub";
import { getPublishedExamProgramBySlug } from "@/lib/exam-hub-programs";
import { serializePublicProgram } from "@/lib/exam-hub";
import { getCurrentAuthUser } from "@/lib/auth-session";
import { connectDB } from "@/lib/mongodb";
import ExamQuestion from "@/models/ExamQuestion";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const program = await getPublishedExamProgramBySlug(slug);

  return {
    title: program ? `${program.title} | SAGE Exam Hub` : "Exam | SAGE Academy",
    description: program?.subtitle || "Exam details and registration",
  };
}

export default async function ExamDetailPage({ params }: Props) {
  const { slug } = await params;
  const program = await getPublishedExamProgramBySlug(slug);
  if (!program) notFound();

  await connectDB();
  const [questionCount, user] = await Promise.all([
    ExamQuestion.countDocuments(activeExamQuestionQuery(program._id)),
    getCurrentAuthUser(),
  ]);

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

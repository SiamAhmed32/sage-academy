import { notFound, redirect } from "next/navigation";

import { ExamInstructionsClient } from "@/components/exam-hub/ExamInstructionsClient";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ attemptId?: string }>;
};

export default async function ExamInstructionsPage({ params, searchParams }: Props) {
  await connectDB();
  const { slug } = await params;
  const { attemptId } = await searchParams;
  if (!attemptId) redirect(`/exams/${slug}`);

  const program = await ExamProgram.findOne({ slug, status: "published", deliveryMode: "online" }).lean();
  if (!program) notFound();

  return (
    <ExamInstructionsClient
      slug={slug}
      attemptId={attemptId}
      title={program.title}
      instructions={program.instructions || ""}
      durationMinutes={program.durationMinutes || 20}
    />
  );
}

import { notFound } from "next/navigation";

import { ExamTakeClient } from "@/components/exam-hub/ExamTakeClient";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";

type Props = { params: Promise<{ slug: string; attemptId: string }> };

export default async function ExamTakePage({ params }: Props) {
  await connectDB();
  const { slug, attemptId } = await params;
  const program = await ExamProgram.findOne({ slug, status: "published", deliveryMode: "online" }).lean();
  if (!program) notFound();

  return <ExamTakeClient slug={slug} attemptId={attemptId} />;
}

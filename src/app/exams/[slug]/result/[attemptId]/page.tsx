import { notFound } from "next/navigation";

import { ExamResultClient } from "@/components/exam-hub/ExamResultClient";
import { getCurrentAuthUser } from "@/lib/auth-session";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";

type Props = { params: Promise<{ slug: string; attemptId: string }> };

export default async function ExamResultPage({ params }: Props) {
  await connectDB();
  const { slug, attemptId } = await params;
  const program = await ExamProgram.findOne({ slug, status: "published", deliveryMode: "online" }).lean();
  if (!program) notFound();
  const user = await getCurrentAuthUser();

  return <ExamResultClient slug={slug} attemptId={attemptId} userPhone={user?.phone || ""} />;
}

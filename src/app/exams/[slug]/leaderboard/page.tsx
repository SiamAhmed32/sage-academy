import { notFound } from "next/navigation";

import { ExamLeaderboardClient } from "@/components/exam-hub/ExamLeaderboardClient";
import { Container } from "@/components/shared/Container";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";

type Props = { params: Promise<{ slug: string }> };

export default async function ExamLeaderboardPage({ params }: Props) {
  await connectDB();
  const { slug } = await params;
  const program = await ExamProgram.findOne({ slug, status: "published", deliveryMode: "online" }).lean();
  if (!program) notFound();

  return (
    <main className="bg-gradient-to-b from-sage-red-50 to-white">
      <section className="border-b border-sage-red-100 py-10">
        <Container>
          <p className="text-sm font-semibold text-sage-primary">Top performers</p>
        </Container>
      </section>
      <ExamLeaderboardClient slug={slug} title={program.title} />
    </main>
  );
}

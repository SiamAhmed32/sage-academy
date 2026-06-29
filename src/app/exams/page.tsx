import { ExamHubExplorer } from "@/components/exam-hub/ExamHubExplorer";
import { ExamHubHero } from "@/components/exam-hub/ExamHubHero";
import { serializePublicProgram } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";

export const metadata = {
  title: "Exam Hub | SAGE Academy",
  description: "Online and offline exams — weekly, monthly, public and private.",
};

export default async function ExamsPage() {
  await connectDB();
  const programs = await ExamProgram.find({ status: "published" })
    .sort({ featured: -1, order: 1, startDate: 1 })
    .lean();

  const serialized = programs.map((program) => serializePublicProgram(program as Record<string, unknown>));

  return (
    <main className="bg-sage-white">
      <ExamHubHero />
      <ExamHubExplorer programs={serialized} />
    </main>
  );
}

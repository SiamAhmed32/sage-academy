import { ExamHubExplorer } from "@/components/exam-hub/ExamHubExplorer";
import { ExamHubHero } from "@/components/exam-hub/ExamHubHero";
import { getPublishedExamPrograms } from "@/lib/exam-hub-programs";
import type { PublicExamProgram } from "@/lib/exam-hub";

export const revalidate = 60;

export const metadata = {
  title: "Exam Hub | SAGE Academy",
  description: "Online and offline exams — weekly, monthly, public and private.",
};

export default async function ExamsPage() {
  let serialized: PublicExamProgram[] = [];

  try {
    serialized = await getPublishedExamPrograms();
  } catch (error) {
    console.error("Exams page fetch failed:", error);
  }

  return (
    <main className="bg-sage-white">
      <ExamHubHero />
      <ExamHubExplorer programs={serialized} />
    </main>
  );
}

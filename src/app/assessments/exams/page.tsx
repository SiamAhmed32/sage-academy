import { AssessmentHubClient } from "@/components/assessments/AssessmentHubClient";
import { Container } from "@/components/shared/Container";
import { getPublicAssessments } from "@/lib/assessments";
import { connectDB } from "@/lib/mongodb";

export default async function ExamsPage() {
  await connectDB();
  const assessments = (await getPublicAssessments({ featuredOnly: false, limit: 48 })).filter((item) => item.kind === "exam");

  return (
    <main className="bg-sage-cream">
      <section className="border-b border-sage-warm-border bg-white py-16 sm:py-20">
        <Container>
          <p className="inline-flex rounded-full bg-sage-red-50 px-4 py-2 text-sm font-black text-sage-primary ring-1 ring-sage-red-100">
            Exams
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-sage-secondary sm:text-5xl">
            চলমান এক্সাম প্রোগ্রাম
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-sage-gray-700">
            নিয়মিত পরীক্ষা, half yearly, pre-test এবং final preparation এক জায়গায়।
          </p>
        </Container>
      </section>
      <Container className="py-12 sm:py-16">
        <AssessmentHubClient assessments={JSON.parse(JSON.stringify(assessments))} />
      </Container>
    </main>
  );
}

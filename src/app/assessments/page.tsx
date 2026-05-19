import { AssessmentHubClient } from "@/components/assessments/AssessmentHubClient";
import { Container } from "@/components/shared/Container";
import { getPublicAssessments } from "@/lib/assessments";
import { connectDB } from "@/lib/mongodb";

export default async function AssessmentsPage() {
  await connectDB();
  const assessments = await getPublicAssessments({ featuredOnly: false, limit: 48 });

  return (
    <main className="bg-sage-cream">
      <section className="relative overflow-hidden border-b border-sage-warm-border bg-white py-16 sm:py-20">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,#feeceb_0%,transparent_62%)] lg:block" />
        <Container className="relative">
          <p className="inline-flex rounded-full bg-sage-red-50 px-4 py-2 text-sm font-black text-sage-primary ring-1 ring-sage-red-100">
            Exam Program Hub
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-sage-secondary sm:text-5xl">
            আপনার শ্রেণি, স্কুল ও পরীক্ষার জন্য সঠিক প্রোগ্রাম খুঁজুন
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-sage-gray-700">
            মডেল টেস্ট, নিয়মিত পরীক্ষা, স্কুল-ফোকাসড প্রস্তুতি, checked answer script এবং Solve Class সহ চলমান সব প্রোগ্রাম এক জায়গায়।
          </p>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <AssessmentHubClient assessments={JSON.parse(JSON.stringify(assessments))} />
      </Container>
    </main>
  );
}

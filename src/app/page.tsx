import { HeroSection } from "@/components/home/HeroSection";
import { HeroImagePreloads } from "@/components/home/HeroImagePreloads";
import { TeacherSection } from "@/components/home/TeacherSection";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { WhyChooseSection } from "@/components/home/WhyChooseSection";
import { BatchSection } from "@/components/home/BatchSection";
import { OfflineLearningSection } from "@/components/home/OfflineLearningSection";
import { QuizSection } from "@/components/quiz/QuizSection";
import { ContactSection } from "@/components/home/ContactSection";
import { FreeClassSection } from "@/components/home/FreeClassSection";
import { ExamHubHomeSection } from "@/components/exam-hub/ExamHubHomeSection";
import { getOptionalSessionFromCookies } from "@/lib/auth";

export default async function Home() {
  const session = await getOptionalSessionFromCookies();
  const user = session ? { id: session.sub, name: session.name } : null;

  return (
    <main>
      <HeroImagePreloads />
      <HeroSection />
      <BatchSection />
      <ExamHubHomeSection />
      {/* Legacy model-test / exam registration hub — use Exam Hub (/exams) instead */}
      {/* <AssessmentCommandSection /> */}
      <FreeClassSection />
      {/* <QuizSection user={user} /> */}
      <WhyChooseSection />
      {/* <TeacherSection /> */}
      <TestimonialSection />
      {/* <OfflineLearningSection /> */}
      <ContactSection />
    </main>
  );
}

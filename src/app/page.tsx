import { HeroSection } from "@/components/home/HeroSection";
import { TeacherSection } from "@/components/home/TeacherSection";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { WhyChooseSection } from "@/components/home/WhyChooseSection";
import { BatchSection } from "@/components/home/BatchSection";
import { OfflineLearningSection } from "@/components/home/OfflineLearningSection";
import { QuizSection } from "@/components/quiz/QuizSection";
import { ContactSection } from "@/components/home/ContactSection";
import { FreeClassSection } from "@/components/home/FreeClassSection";
import { ExamHubHomeSection } from "@/components/exam-hub/ExamHubHomeSection";

export const revalidate = 60;

export default function Home() {

  return (
    <main>
      <HeroSection />
      <FreeClassSection />
      <BatchSection />
      {/* <ExamHubHomeSection /> */}
      {/* Legacy model-test / exam registration hub — use Exam Hub (/exams) instead */}
      {/* <AssessmentCommandSection /> */}
      {/* <QuizSection user={user} /> */}
      <WhyChooseSection />
      {/* <TeacherSection /> */}
      <TestimonialSection />
      {/* <OfflineLearningSection /> */}
      <ContactSection />
    </main>
  );
}

import AboutHero from "@/components/about/AboutHero";
import OurStory from "@/components/about/OurStory";
import MissionVision from "@/components/about/MissionVision";
import StatsSection from "@/components/about/StatsSection";
import ValuesSection from "@/components/about/ValuesSection";
import DirectorMessage from "@/components/about/DirectorMessage";

export const metadata = {
  title: "আমাদের সম্পর্কে | SAGE Academy",
  description: "SAGE Academy-র লক্ষ্য, উদ্দেশ্য এবং আমাদের অভিজ্ঞ শিক্ষক মন্ডলী সম্পর্কে বিস্তারিত জানুন।",
};

export default function AboutPage() {
  return (
    <main>
      <AboutHero />
      <OurStory />
      <StatsSection />
      <MissionVision />
      <ValuesSection />
      <DirectorMessage />
    </main>
  );
}

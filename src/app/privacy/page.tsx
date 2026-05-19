import PrivacyHero from "@/components/privacy/PrivacyHero";
import PrivacyContent from "@/components/privacy/PrivacyContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "প্রাইভেসি পলিসি | SAGE Academy",
  description: "SAGE Academy-র প্রাইভেসি পলিসি এবং আপনার তথ্যের সুরক্ষা সংক্রান্ত বিস্তারিত তথ্য।",
  keywords: ["SAGE Academy", "Privacy Policy", "Data Protection", "Bangladesh Education"],
};

export default function PrivacyPage() {
  return (
    <main>
      <PrivacyHero />
      <PrivacyContent />
    </main>
  );
}

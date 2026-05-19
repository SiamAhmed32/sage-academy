import { FAQHero } from "@/components/faq/FAQHero";
import { FAQAccordion } from "@/components/faq/FAQAccordion";

export const metadata = {
  title: "সাধারণ জিজ্ঞাসা (FAQ) | SAGE Academy",
  description: "SAGE Academy সম্পর্কে আপনার মনে থাকা বিভিন্ন প্রশ্নের উত্তর এখানে পাবেন।",
};

export default function FAQPage() {
  return (
    <main>
      <FAQHero />
      <FAQAccordion />
    </main>
  );
}

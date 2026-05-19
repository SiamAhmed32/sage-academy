"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { TestimonialCard, type DynamicTestimonial } from "./TestimonialCard";

const sectionContent = {
  badge: "অভিভাবক ও শিক্ষার্থীদের মতামত",
  titleStart: "যারা আমাদের সাথে",
  titleAccent: "পড়েছে",
  titleEnd: "তাদের অভিজ্ঞতা",
  description: "নিয়মিত ক্লাস, পরীক্ষা ও গাইডলাইনের ধারাবাহিকতায় শিক্ষার্থী ও অভিভাবকদের আস্থা তৈরি করাই আমাদের লক্ষ্য।",
};

export function TestimonialSection() {
  const [testimonials, setTestimonials] = useState<DynamicTestimonial[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const res = await fetch("/api/testimonials", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data)) setTestimonials(json.data);
      } catch (err) { console.error("Testimonial load failed:", err); }
    }
    loadTestimonials();
  }, []);

  useEffect(() => {
    if (testimonials.length < 2) return;
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") 
        setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(intervalId);
  }, [testimonials.length]);

  const visibleTestimonials = useMemo(() => 
    testimonials.map((_, i) => testimonials[(activeIndex + i) % testimonials.length]).slice(0, 3),
    [activeIndex, testimonials]
  );

  if (testimonials.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-sage-cream py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,var(--color-sage-cream)_0%,#fff_48%,var(--color-sage-cream-deep)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(var(--color-sage-primary)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -left-36 top-28 h-[30rem] w-[30rem] rounded-full bg-sage-card-rose/70" />
      <div className="absolute -right-24 top-20 h-[26rem] w-[26rem] rounded-full bg-sage-card-honey/80" />

      <Container className="relative">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full bg-sage-secondary px-4 py-2 text-sm font-black text-white shadow-lg shadow-sage-secondary/15">
              {sectionContent.badge}
            </div>
            <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[1.06] text-sage-secondary sm:text-5xl lg:text-[4.25rem]">
              {sectionContent.titleStart}{" "}
              <span className="relative inline-block text-sage-primary">
                {sectionContent.titleAccent}
                <span className="absolute -bottom-2 left-0 h-3 w-full rounded-full bg-sage-gold/40" />
              </span>{" "}
              {sectionContent.titleEnd}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-sage-gray-700 sm:text-lg">{sectionContent.description}</p>
          </div>

          <div className="flex items-center gap-4">
            <NavBtn icon={<ChevronLeft size={22} />} onClick={() => setActiveIndex((p) => p === 0 ? testimonials.length - 1 : p - 1)} />
            <NavBtn icon={<ChevronRight size={22} />} onClick={() => setActiveIndex((p) => (p + 1) % testimonials.length)} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeIndex} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.35 }} className="mt-12 grid items-stretch gap-7 md:grid-cols-2 xl:grid-cols-3">
            {visibleTestimonials.map((item, index) => <TestimonialCard key={item._id} item={item} index={index} />)}
          </motion.div>
        </AnimatePresence>
      </Container>
    </section>
  );
}

const NavBtn = ({ icon, onClick }: { icon: React.ReactNode, onClick: () => void }) => (
  <button onClick={onClick} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sage-warm-border bg-sage-white text-sage-secondary shadow-sm transition hover:-translate-y-0.5 hover:border-sage-primary hover:text-sage-primary">
    {icon}
  </button>
);

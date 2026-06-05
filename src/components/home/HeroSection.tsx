"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { heroHighlights, heroTeachers } from "@/constants/hero";
import { Container } from "@/components/shared/Container";
import { HeroActions } from "@/components/home/HeroActions";
import { HeroStats } from "@/components/home/HeroStats";
import { HeroVisual } from "@/components/home/HeroVisual";

const heroDescription =
  "ষষ্ঠ থেকে দ্বাদশ শ্রেণির শিক্ষার্থীদের জন্য Conceptual Teaching, ছোট ব্যাচে ব্যক্তিগত যত্ন, নিয়মিত মূল্যায়ন এবং অভিজ্ঞ শিক্ষকদের তত্ত্বাবধানে মানসম্মত একাডেমিক সহায়তা।";

export function HeroSection() {
  const [activeTeacher, setActiveTeacher] = useState(0);
  const teacher = heroTeachers[activeTeacher];

  useEffect(() => {
    heroTeachers.forEach((item) => {
      const img = new window.Image();
      img.src = item.image;
    });

    const timer = setInterval(() => {
      setActiveTeacher((prev) => (prev + 1) % heroTeachers.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#fffafa_0%,#ffffff_48%,#fff0f0_100%)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sage-red-100 to-transparent" />
      <div className="absolute left-0 top-24 h-72 w-full bg-[radial-gradient(ellipse_at_left,rgba(109,15,18,0.08),transparent_58%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white/80 to-transparent" />

      <Container className="relative grid min-h-[calc(100svh-5rem)] grid-cols-1 items-center gap-9 py-9 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(430px,0.9fr)] lg:gap-12 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <p className="mb-4 inline-flex rounded-full border border-sage-red-100 bg-white/80 px-5 py-2 text-sm font-semibold text-sage-primary shadow-sm shadow-sage-red-100/40 backdrop-blur">
            বাংলা ও ইংলিশ ভার্সনের জন্য
          </p>

          <h1 className="max-w-3xl text-[2.55rem] font-bold leading-[1.16] text-sage-secondary [text-wrap:balance] sm:text-5xl sm:leading-[1.14] lg:text-[4.45rem] lg:leading-[1.1]">
            শুধু ভালো ফল নয়,
            <span className="block text-sage-primary [word-break:keep-all]">গড়ে তুলি আত্মবিশ্বাসী</span>
            শিক্ষার্থী
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-sage-gray-700 sm:text-lg">
            {heroDescription}
          </p>

          <div className="mt-6 flex max-w-2xl flex-wrap gap-2.5">
            {heroHighlights.map((item) => (
              <span
                key={item}
                className="rounded-full border border-sage-red-100 bg-white/88 px-4 py-2 text-sm font-semibold text-sage-gray-700 shadow-sm shadow-sage-red-100/25 backdrop-blur"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8">
            <HeroActions />
          </div>

          <div className="mt-9">
            <HeroStats />
          </div>
        </motion.div>

        <div className="lg:hidden">
          <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-sage-red-100">
            <div className="relative aspect-[1/1] w-full overflow-hidden bg-sage-red-50">
              <AnimatePresence initial={false}>
                <motion.div
                  key={`hero-mobile-${activeTeacher}`}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                >
                  <Image
                    src={teacher.image}
                    alt={teacher.name}
                    fill
                    priority={activeTeacher === 0}
                    sizes="(max-width: 1024px) 100vw, 500px"
                    className={teacher.imageClass}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative min-h-[7.75rem] border-t border-sage-red-100 bg-white px-5 py-4">
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={`hero-mobile-info-${activeTeacher}`}
                  className="absolute inset-x-5 inset-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <div className="flex h-full items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-gray-500">
                        Teachers
                      </p>
                      <h3 className="mt-1 text-xl font-bold leading-7 text-sage-secondary">
                        {teacher.name}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-sage-primary">{teacher.subject}</p>
                    </div>

                    <div className="inline-flex max-w-[9rem] shrink-0 items-center rounded-full border border-sage-red-100 bg-sage-red-50 px-3 py-2 text-xs font-bold leading-5 text-sage-primary">
                      {teacher.experience}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <HeroVisual activeTeacher={activeTeacher} />
      </Container>
    </section>
  );
}

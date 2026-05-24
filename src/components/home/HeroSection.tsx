"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { heroHighlights, heroTeachers } from "@/constants/hero";
import { Container } from "@/components/shared/Container";
import { HeroActions } from "@/components/home/HeroActions";
import { HeroStats } from "@/components/home/HeroStats";
import { HeroVisual } from "@/components/home/HeroVisual";

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
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sage-red-50 via-sage-white to-sage-red-100">
      <div className="absolute -left-28 -top-28 size-80 rounded-full bg-sage-primary/10 blur-3xl" />
      <div className="absolute -right-24 top-20 size-96 rounded-full bg-sage-secondary/10 blur-3xl" />

      <Container className="relative grid min-h-[calc(100svh-5rem)] grid-cols-1 items-center gap-10 py-10 sm:py-14 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1fr_0.9fr] lg:gap-10 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <p className="mb-4 inline-flex rounded-full bg-sage-red-50 px-5 py-2 text-sm font-semibold text-sage-primary ring-1 ring-sage-red-100">
            বাংলা ও ইংলিশ ভার্সনের জন্য
          </p>

          <h1 className="text-4xl font-bold leading-tight text-sage-secondary sm:text-5xl lg:text-7xl">
            সঠিক গাইডলাইনে
            <span className="block text-sage-primary">ভালো ফলাফলের</span>
            প্রস্তুতি
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-sage-gray-700 sm:text-lg">
            SAGE Academy-তে শ্রেণি ৫ থেকে ১২ পর্যন্ত একাডেমিক কেয়ার,
            আলাদা ছেলে-মেয়ে ব্যাচ এবং অভিজ্ঞ শিক্ষকদের মাধ্যমে নিয়মিত পড়াশোনার
            গাইডলাইন।
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {heroHighlights.map((item) => (
              <span
                key={item}
                className="rounded-full bg-sage-white px-4 py-2 text-sm font-medium text-sage-gray-700 shadow-sm ring-1 ring-sage-red-100"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8">
            <HeroActions />
          </div>

          <div className="mt-10">
            <HeroStats />
          </div>
        </motion.div>

        <div className="lg:hidden">
          <div className="relative mx-auto aspect-[1/1] w-full max-w-xl overflow-hidden rounded-[2rem] bg-sage-red-50 shadow-xl ring-1 ring-sage-red-100">
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
        </div>

        <HeroVisual activeTeacher={activeTeacher} />
      </Container>
    </section>
  );
}

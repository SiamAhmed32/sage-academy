"use client";

import Image from "next/image";
import { TrackedLink } from "@/components/engagement/TrackedLink";
import { Container } from "@/components/shared/Container";
import { motion, useReducedMotion } from "framer-motion";
import { offlineLearningContent } from "@/constants/offline-learning";

const viewport = { once: true, amount: 0.22 };

const textEase = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemBlurReveal = (reduceMotion: boolean) => ({
  hidden: reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, filter: "blur(12px)" },
  show: reduceMotion
    ? { opacity: 1, transition: { duration: 0.35, ease: textEase } }
    : {
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.58, ease: textEase },
    },
});

export function OfflineLearningSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="offline-learning"
      aria-labelledby="offline-learning-heading"
      className="relative overflow-hidden bg-gradient-to-br from-sage-red-50 via-sage-white to-sage-red-100 py-16 sm:py-20 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_30%,rgba(254,242,242,0.9),transparent_60%)]"
        aria-hidden
      />

      {/* Visual Background Blobs for consistency with Hero */}
      <div className="absolute -left-28 -top-28 size-80 rounded-full bg-sage-primary/10 blur-3xl" />
      <div className="absolute -right-24 bottom-20 size-96 rounded-full bg-sage-secondary/10 blur-3xl" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">

          {/* Visual Side: Image without card container */}
          <div className="relative order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={viewport}
              className="relative z-10 mx-auto w-full max-w-[320px] sm:max-w-[380px] lg:max-w-md"
            >
              <Image
                src={offlineLearningContent.imageSrc}
                alt={offlineLearningContent.imageAlt}
                width={600}
                height={600}
                className="h-auto w-full object-contain drop-shadow-2xl"
                priority
              />
            </motion.div>
          </div>

          {/* Content Side: Hero-style Typography */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="order-1 lg:order-2"
          >
            <motion.div variants={itemBlurReveal(!!reduceMotion)}>
              <span className="inline-flex rounded-full bg-sage-red-50 px-5 py-2 text-sm font-semibold text-sage-primary ring-1 ring-sage-red-100">
                {offlineLearningContent.badge}
              </span>
            </motion.div>

            <motion.h2
              id="offline-learning-heading"
              variants={itemBlurReveal(!!reduceMotion)}
              className="mt-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-sage-secondary sm:text-5xl lg:text-6xl"
            >
              <span className="block">{offlineLearningContent.titleLine1}</span>
              <span className="mt-2 block text-sage-primary">
                {offlineLearningContent.titleAccent}
              </span>
            </motion.h2>

            <motion.div
              variants={itemBlurReveal(!!reduceMotion)}
              className="mt-8 space-y-6 text-base leading-relaxed text-sage-gray-700 sm:text-lg"
            >
              {offlineLearningContent.paragraphs.map((para, index) => (
                <p key={index} className="text-pretty">
                  {para}
                </p>
              ))}
            </motion.div>

            <motion.div variants={itemBlurReveal(!!reduceMotion)} className="mt-12 flex flex-wrap gap-4">
              <TrackedLink
                href="/admission"
                trackingLabel="offline_learning_admission_cta"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-sage-primary px-8 py-4 text-base font-bold text-white shadow-xl shadow-sage-primary/20 transition-all hover:bg-sage-secondary active:scale-95"
              >
                ভর্তি ও পরামর্শ
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </TrackedLink>

              <TrackedLink
                href="/batches"
                trackingLabel="offline_learning_courses_anchor"
                className="inline-flex items-center justify-center rounded-full border border-sage-red-100 bg-sage-white px-8 py-4 text-base font-bold text-sage-secondary transition-all hover:bg-sage-red-50"
              >
                কোর্সসমূহ দেখুন
              </TrackedLink>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

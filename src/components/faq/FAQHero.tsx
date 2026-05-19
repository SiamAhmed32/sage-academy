"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { faqContent } from "@/constants/faq";

export function FAQHero() {
  const { hero } = faqContent;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sage-red-50 via-sage-white to-sage-red-100 py-20 lg:py-32">
      <div className="absolute -left-28 -top-28 size-80 rounded-full bg-sage-primary/10 blur-3xl" />
      <div className="absolute -right-24 top-20 size-96 rounded-full bg-sage-secondary/10 blur-3xl" />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-flex rounded-full bg-sage-red-100 px-4 py-1.5 text-sm font-bold text-sage-primary">
              {hero.badge}
            </span>
            <h1 className="text-4xl font-bold leading-tight text-sage-secondary sm:text-5xl lg:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-sage-gray-700">
              {hero.description}
            </p>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

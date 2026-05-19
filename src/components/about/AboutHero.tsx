"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { aboutContent } from "@/constants/about";
import Image from "next/image";

export default function AboutHero() {
  const { hero } = aboutContent;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sage-red-50 via-sage-white to-sage-red-100 py-20 lg:py-32">
      <div className="absolute -left-28 -top-28 size-80 rounded-full bg-sage-primary/10 blur-3xl" />
      <div className="absolute -right-24 top-20 size-96 rounded-full bg-sage-secondary/10 blur-3xl" />

      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <span className="mb-4 inline-flex rounded-full bg-sage-red-100 px-4 py-1.5 text-sm font-bold text-sage-primary">
              {hero.badge}
            </span>
            <h1 className="text-4xl font-bold leading-tight text-sage-secondary sm:text-5xl lg:text-6xl">
              {hero.title.split(":")[0]}:
              <span className="block text-sage-primary">{hero.title.split(":")[1]}</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-sage-gray-700">
              {hero.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-sage-white shadow-2xl ring-1 ring-sage-red-200"
          >
            <Image
              src={hero.image}
              alt="About SAGE Academy"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

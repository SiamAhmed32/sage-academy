"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/shared/Container";
import { aboutContent } from "@/constants/about";

export default function AboutHero() {
  const { hero } = aboutContent;
  const [titleLead, titleAccent = ""] = hero.title.split(":");

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[linear-gradient(118deg,#fff8f8_0%,#fff3f3_46%,#ffffff_46%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(#7a1015_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute -left-10 top-0 h-[65%] w-[42%] bg-[radial-gradient(ellipse_at_top_left,rgba(109,15,18,0.07),transparent_68%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sage-red-100/80 to-transparent" />

      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-10 py-14 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-20 xl:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            viewport={{ once: true }}
            className="lg:pr-4"
          >
            <Badge
              variant="outline"
              className="mb-6 h-auto rounded-full border-sage-red-100 bg-white/90 px-4 py-1.5 text-sm font-semibold text-sage-primary shadow-sm"
            >
              {hero.badge}
            </Badge>

            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-sage-secondary sm:text-[2.75rem] lg:text-5xl">
              {titleLead.trim()}:
              <span className="mt-2 block text-sage-primary">{titleAccent.trim()}</span>
            </h1>

            <p className="mt-6 text-base leading-[1.85] text-sage-gray-600 sm:text-[1.0625rem]">
              {hero.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            viewport={{ once: true }}
            className="w-full lg:pl-2"
          >
            {/* Matches photo ratio (1600×830) — no letterboxing, no inner borders */}
            <div className="relative aspect-[160/83] w-full overflow-hidden rounded-[1.75rem] shadow-[0_28px_64px_-16px_rgba(109,15,18,0.22)]">
              <Image
                src={hero.image}
                alt="About SAGE Academy"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

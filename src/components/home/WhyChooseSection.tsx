"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { HiCheck } from "react-icons/hi";

import { Container } from "@/components/shared/Container";
import { whyChooseContent } from "@/constants/why-choose";

export function WhyChooseSection() {
  return (
    <section className="relative overflow-hidden bg-sage-primary py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-sage-white/10 via-transparent to-transparent" />
      <div className="absolute left-[-2.5rem] top-44 grid grid-cols-6 gap-3 opacity-25">
        {Array.from({ length: 30 }).map((_, index) => (
          <span key={index} className="h-1.5 w-1.5 rounded-full bg-sage-white" />
        ))}
      </div>

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55 }}
          >
            <p className="text-base font-semibold text-sage-red-100 sm:text-lg">
              {whyChooseContent.badge}
            </p>
            <h2 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-sage-white sm:text-4xl lg:text-6xl">
              {whyChooseContent.titleStart}
              <span className="block text-sage-red-100 underline decoration-sage-red-100 decoration-4 underline-offset-6">
                {whyChooseContent.titleAccent}
              </span>
              <span className="block">{whyChooseContent.titleEnd}</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-sage-white/80 sm:text-lg">
              {whyChooseContent.description}
            </p>

            <div className="mt-8 space-y-4">
              {whyChooseContent.highlights.map((item) => (
                <div key={item} className="flex items-start gap-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sage-red-100 text-sage-primary">
                    <HiCheck size={20} />
                  </span>
                  <p className="text-lg font-medium leading-8 text-sage-white">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="mt-10 inline-flex items-center rounded-full bg-sage-white px-6 py-3 text-sm font-semibold text-sage-primary transition hover:bg-sage-red-50"
            >
              {whyChooseContent.ctaLabel}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55 }}
            className="mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]">
              <Image
                src={whyChooseContent.image}
                alt={whyChooseContent.imageAlt}
                fill
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

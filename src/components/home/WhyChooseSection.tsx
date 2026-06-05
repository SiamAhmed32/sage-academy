"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, BookOpen, MessageSquare, HeartHandshake, ArrowRight } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { whyChooseContent } from "@/constants/why-choose";

const iconMap: Record<string, any> = {
  award: Award,
  book: BookOpen,
  chat: MessageSquare,
  heart: HeartHandshake,
};

export function WhyChooseSection() {
  return (
    <section className="relative overflow-hidden bg-sage-primary py-20 lg:py-28 text-white">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-sage-white/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute right-[-2.5rem] top-1/4 grid grid-cols-6 gap-3 opacity-10 pointer-events-none">
        {Array.from({ length: 24 }).map((_, index) => (
          <span key={index} className="h-1.5 w-1.5 rounded-full bg-white" />
        ))}
      </div>

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Left Column Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sage-red-100 backdrop-blur-sm ring-1 ring-white/10">
              {whyChooseContent.badge}
            </span>
            <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              {whyChooseContent.titleStart}{" "}
              <span className="text-sage-red-100">
                {whyChooseContent.titleAccent}
              </span>
              <span className="block mt-1">{whyChooseContent.titleEnd}</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-sage-red-100/80 sm:text-lg">
              {whyChooseContent.description}
            </p>

            {/* 2x2 Interactive Grid */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {whyChooseContent.highlights.map((item, index) => {
                const Icon = iconMap[item.icon] || Award;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group flex gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/10"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sage-red-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-sage-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-base">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-sage-red-100/70">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA Button */}
            <div className="mt-10">
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-sage-primary shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-sage-red-50 hover:shadow-white/10"
              >
                {whyChooseContent.ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65 }}
            className="relative mx-auto w-full max-w-sm lg:max-w-md"
          >
            {/* Visual Frame accents */}
            <div className="absolute -left-6 -top-6 h-12 w-12 border-l-4 border-t-4 border-white/20 rounded-tl-3xl pointer-events-none" />
            <div className="absolute -right-6 -bottom-6 h-12 w-12 border-r-4 border-b-4 border-white/20 rounded-br-3xl pointer-events-none" />

            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sage-white shadow-2xl ring-8 ring-white/5 hover:ring-white/10 transition-all duration-300">
              <Image
                src={whyChooseContent.image}
                alt={whyChooseContent.imageAlt}
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  MessageCircleQuestion,
} from "lucide-react";

import { Container } from "@/components/shared/Container";
import { whyChooseContent } from "@/constants/why-choose";
import { cn } from "@/lib/utils";

const iconMap = {
  teacher: GraduationCap,
  exam: CalendarCheck,
  doubt: MessageCircleQuestion,
  homework: ClipboardCheck,
} as const;

/*
 * Each highlight gets its own soft tint (like a dashboard stat card), all kept
 * warm and light so they sit well next to the burgundy brand colour.
 */
const tones = [
  { card: "bg-[#FFF1F1] border-[#F6D9D9]", icon: "text-sage-primary", bar: "bg-sage-primary" },
  { card: "bg-[#EEF4FF] border-[#D7E3FA]", icon: "text-[#2F5AA8]", bar: "bg-[#2F5AA8]" },
  { card: "bg-[#EDF8F1] border-[#CFEBDA]", icon: "text-[#1E7A4C]", bar: "bg-[#1E7A4C]" },
  { card: "bg-[#FFF6E6] border-[#F3E0B8]", icon: "text-[#9B6A12]", bar: "bg-[#C9921C]" },
] as const;

function HighlightCard({ index }: { index: number }) {
  const item = whyChooseContent.highlights[index];
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? GraduationCap;
  const tone = tones[index % tones.length];
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border p-5 transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(90,0,0,0.35)] sm:p-6",
        tone.card
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_6px_16px_-10px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105",
          tone.icon
        )}
      >
        <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
      </span>

      <h3 className="mt-5 text-lg font-semibold leading-snug text-sage-secondary sm:text-[1.2rem]">{item.title}</h3>
      <p className="mt-2 text-[15px] leading-7 text-sage-gray-700">{item.desc}</p>

      {/* Accent line that grows on hover, pinned to the card bottom */}
      <span className="min-h-5 flex-1" aria-hidden="true" />
      <span
        aria-hidden="true"
        className={cn(
          "block h-[3px] w-10 rounded-full opacity-70 transition-all duration-500 group-hover:w-20 group-hover:opacity-100",
          tone.bar
        )}
      />
    </motion.article>
  );
}

function WhyChoosePhoto() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-xl lg:max-w-none"
    >
      {/* Brand shapes behind the photo */}
      <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-[1.6rem] bg-sage-gold/30" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rotate-12 rounded-[1.4rem] border-[10px] border-sage-primary/10" />

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] shadow-[0_24px_50px_-28px_rgba(90,0,0,0.45)] ring-1 ring-sage-red-100 lg:aspect-[4/5]">
        <Image
          src={whyChooseContent.image}
          alt={whyChooseContent.imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-cover object-center"
        />
      </div>
    </motion.div>
  );
}

export function WhyChooseSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[#FFFAF6] py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#7a1015_1px,transparent_1px)] [background-size:24px_24px]" />

      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14 xl:gap-16">
          <div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
            >
              <p className="sage-eyebrow">{whyChooseContent.title}</p>
              <h2 className="sage-h2 bn-headline mt-4 max-w-2xl">{whyChooseContent.subtitle}</h2>
              <p className="sage-lead mt-4 max-w-2xl">{whyChooseContent.description}</p>
            </motion.div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
              {whyChooseContent.highlights.map((item, index) => (
                <HighlightCard key={item.title} index={index} />
              ))}
            </div>

            <div className="mt-8">
              <Link href="/about" className="sage-btn sage-btn-secondary group">
                {whyChooseContent.ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <WhyChoosePhoto />
        </div>
      </Container>
    </section>
  );
}

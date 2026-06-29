"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { heroCopy, heroHighlights, heroTeachers } from "@/constants/hero";
import { Container } from "@/components/shared/Container";
import { HeroActions } from "@/components/home/HeroActions";
import { HeroStats } from "@/components/home/HeroStats";
import { HeroVisual } from "@/components/home/HeroVisual";

const HIGHLIGHT_ICONS = ["✦", "◈", "✧"];

export function HeroSection() {
  const [activeTeacher, setActiveTeacher] = useState(0);

  useEffect(() => {
    heroTeachers.slice(0, 4).forEach((item) => {
      const img = new window.Image();
      img.src = encodeURI(item.image);
    });

    const timer = setInterval(() => {
      setActiveTeacher((prev) => (prev + 1) % heroTeachers.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-white">
      {/* ── Layer 1: Diagonal two-tone split (cream left → white right) ── */}
      <div className="absolute inset-0 bg-[linear-gradient(118deg,#fff8f8_0%,#fff3f3_44%,#ffffff_44%,#ffffff_100%)]" />

      {/* ── Layer 2: Crimson dot grid (matches FreeClassSection) ── */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#7a1015_1px,transparent_1px)] [background-size:22px_22px]" />

      {/* ── Layer 3: Geometric shapes ── */}

      {/* Large outlined diamond — top-left corner, gold tint */}
      <div className="pointer-events-none absolute -left-14 -top-14 hidden h-56 w-56 rotate-12 rounded-[2rem] border-[22px] border-sage-gold/22 md:block" />

      {/* Second outlined diamond — mid-left, slightly smaller, crimson tint */}
      <div className="pointer-events-none absolute left-[6%] top-[55%] hidden h-36 w-36 rotate-45 rounded-[1.4rem] border-[14px] border-sage-primary/10 lg:block" />

      {/* Small filled accent square — bottom-right of left panel */}
      <div className="pointer-events-none absolute bottom-10 left-[38%] hidden h-20 w-20 -rotate-12 rounded-[1rem] bg-sage-primary/7 lg:block" />

      {/* Tiny gold dot cluster — upper right of left panel (visual balance) */}
      <div className="pointer-events-none absolute left-[46%] top-6 hidden h-8 w-8 rotate-45 rounded-md border-[6px] border-sage-gold/30 md:block" />

      {/* ── Layer 4: Soft radial glow (warms the left cream zone) ── */}
      <div className="pointer-events-none absolute -left-10 top-0 h-[70%] w-[45%] bg-[radial-gradient(ellipse_at_top_left,rgba(109,15,18,0.07),transparent_65%)]" />

      {/* ── Layer 5: Top & bottom gradient fades for clean edges ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/60 to-transparent" />

      {/* Top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sage-red-100 to-transparent" />

      <Container className="relative grid grid-cols-1 items-center gap-10 py-10 sm:py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(430px,0.9fr)] lg:gap-12 lg:py-14">
        {/* ───── LEFT SIDE ───── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl overflow-visible lg:max-w-[48rem] xl:max-w-[52rem]"
        >
          {/* ── Badge ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <span className="bn-pill mb-6 inline-flex items-center gap-2.5 rounded-full border border-sage-red-100 bg-white/90 px-5 py-2.5 text-sm font-semibold leading-normal text-sage-primary shadow-md shadow-sage-red-100/50 backdrop-blur">
              {/* Animated pulsing dot */}
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-primary opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sage-primary" />
              </span>
              {heroCopy.badge}
            </span>
          </motion.div>

          {/* ── Headline ── */}
          <motion.h1
            lang="bn"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.6 }}
            className="max-w-[48rem] text-[1.95rem] font-semibold text-sage-secondary sm:text-[2.35rem] lg:text-[2.25rem] xl:text-[2.4rem]"
          >
            <span className="bn-headline block xl:whitespace-nowrap">
              {heroCopy.headlineLine1}
            </span>
            {/* Second line with decorative underline highlight */}
            <span className="bn-headline-subline relative block text-sage-primary lg:whitespace-nowrap">
              {heroCopy.headlineLine2}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-[3px] w-[72%] rounded-full bg-gradient-to-r from-sage-primary via-[#C8161D] to-transparent opacity-30"
              />
            </span>
          </motion.h1>

          {/* ── Description ── */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.6 }}
            className="bn-text mt-6 max-w-[52ch] text-[20px] leading-8 text-sage-gray-700 sm:mt-7 sm:text-[1.25rem]"
          >
            {heroCopy.description}
          </motion.p>

          {/* ── Highlight Chips ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.55 }}
            className="mt-6 flex max-w-2xl flex-wrap gap-2.5"
          >
            {heroHighlights.map((item, i) => (
              <span
                key={item}
                className="bn-pill flex items-center gap-2 rounded-full border border-sage-red-100 bg-white px-4 py-2.5 text-sm font-semibold leading-normal text-sage-gray-700 shadow-sm shadow-sage-red-100/30 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-sage-primary/30 hover:shadow-md hover:shadow-sage-red-100/40"
              >
                <span className="text-xs font-bold text-sage-primary">{HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length]}</span>
                {item}
              </span>
            ))}
          </motion.div>

          {/* ── CTA Buttons ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46, duration: 0.55 }}
            className="mt-8 sm:mt-9"
          >
            <HeroActions />
          </motion.div>

          {/* ── Stats ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56, duration: 0.55 }}
          >
            <HeroStats />
          </motion.div>
        </motion.div>

        {/* ───── RIGHT SIDE ───── */}
        <div className="pb-8 lg:pb-10">
          <HeroVisual activeTeacher={activeTeacher} />
        </div>
      </Container>

      {/* Bottom border */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sage-red-100/80 to-transparent" />
    </section>
  );
}

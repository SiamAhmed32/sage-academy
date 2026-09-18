"use client";

import { memo, useEffect, useState } from "react";

import { heroCopy, heroGallerySlides, heroHighlights } from "@/constants/hero";
import { Container } from "@/components/shared/Container";
import { HeroActions } from "@/components/home/HeroActions";
import { HeroStats } from "@/components/home/HeroStats";
import { HeroVisual } from "@/components/home/HeroVisual";

const HIGHLIGHT_ICONS = ["✦", "◈", "✧"];

const HeroCopy = memo(function HeroCopy() {
  return (
    <div className="sage-hero-in min-w-0 max-w-2xl overflow-visible [overflow-anchor:none] lg:max-w-none">
      <span className="bn-pill mb-6 inline-flex max-w-full items-center gap-2.5 rounded-full border border-sage-red-100 bg-white/90 px-5 py-2.5 text-sm font-semibold leading-normal text-sage-primary shadow-md shadow-sage-red-100/50 backdrop-blur">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-primary opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sage-primary" />
        </span>
        <span className="min-w-0">{heroCopy.badge}</span>
      </span>

      <h1
        lang="bn"
        className="max-w-[48rem] text-[1.95rem] font-semibold text-sage-secondary sm:text-[2.35rem] lg:max-w-none lg:text-[2.15rem] xl:text-[2.4rem]"
      >
        <span className="bn-headline block">{heroCopy.headlineLine1}</span>
        <span className="bn-headline-subline relative inline-block max-w-full text-sage-primary">
          {heroCopy.headlineLine2}
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-0 h-[3px] w-[72%] max-w-full rounded-full bg-gradient-to-r from-sage-primary via-[#C8161D] to-transparent opacity-30"
          />
        </span>
      </h1>

      <p className="bn-text mt-6 hidden max-w-[52ch] text-[20px] leading-8 text-sage-gray-700 sm:mt-7 sm:text-[1.25rem] lg:block">
        {heroCopy.description}
      </p>

      <div className="mt-6 flex max-w-2xl flex-wrap gap-2.5">
        {heroHighlights.map((item, i) => (
          <span
            key={item}
            className="bn-pill inline-flex max-w-full items-center gap-2 rounded-full border border-sage-red-100 bg-white px-4 py-2.5 text-sm font-semibold leading-normal text-sage-gray-700 shadow-sm shadow-sage-red-100/30 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-sage-primary/30 hover:shadow-md hover:shadow-sage-red-100/40"
          >
            <span className="shrink-0 text-xs font-bold text-sage-primary">
              {HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length]}
            </span>
            <span className="min-w-0">{item}</span>
          </span>
        ))}
      </div>

      <div className="mt-8 sm:mt-9">
        <HeroActions />
      </div>

      <HeroStats />
    </div>
  );
});

export function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    heroGallerySlides.slice(0, 3).forEach((item) => {
      const img = new window.Image();
      img.src = encodeURI(item.image);
    });

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroGallerySlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-x-clip overflow-y-visible bg-white [overflow-anchor:none]">
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
      <div className="absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-sage-red-100 to-transparent lg:block" />

      {/* Mobile: full-width hero image first (edge to edge) */}
      <div className="relative z-10 lg:hidden">
        <HeroVisual activeIndex={activeSlide} />
      </div>

      <Container className="relative grid grid-cols-1 items-center gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10 lg:py-14 xl:gap-12">
        <HeroCopy />

        <div className="hidden min-w-0 pb-8 lg:block lg:pb-10">
          <HeroVisual activeIndex={activeSlide} />
        </div>
      </Container>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sage-red-100/80 to-transparent" />
    </section>
  );
}

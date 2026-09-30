"use client";

import { memo, useEffect, useState } from "react";

import { heroCopy, heroGallerySlides, heroHighlights } from "@/constants/hero";
import { Container } from "@/components/shared/Container";
import { HeroActions } from "@/components/home/HeroActions";
import { HeroStats } from "@/components/home/HeroStats";
import { HeroVisual } from "@/components/home/HeroVisual";


const HeroCopy = memo(function HeroCopy() {
  return (
    <div className="sage-hero-in min-w-0 max-w-2xl overflow-visible [overflow-anchor:none] lg:max-w-none">
      <span className="bn-pill mb-6 inline-flex max-w-full items-center gap-2.5 rounded-full border border-sage-primary/15 bg-sage-primary/[0.04] py-1.5 pl-2 pr-4 text-[13px] font-semibold leading-normal text-sage-primary sm:text-sm">
        <span className="relative flex h-2 w-2 shrink-0 translate-x-1 mr-1">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-primary opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-primary" />
        </span>
        <span className="min-w-0">{heroCopy.badge}</span>
      </span>

      <h1 lang="bn" className="sage-display max-w-[48rem] lg:max-w-none">
        <span className="bn-headline block lg:whitespace-nowrap">{heroCopy.headlineLine1}</span>
        <span className="bn-headline-subline relative inline-block max-w-full text-sage-primary lg:whitespace-nowrap">
          {heroCopy.headlineLine2}
          <span
            aria-hidden="true"
            className="absolute -bottom-2 left-0 h-[2px] w-24 rounded-full bg-sage-primary/60"
          />
        </span>
      </h1>

      <p className="sage-lead mt-7 hidden max-w-[52ch] lg:block">
        {heroCopy.description}
      </p>

      <ul className="mt-6 flex max-w-2xl flex-wrap gap-x-6 gap-y-3">
        {heroHighlights.map((item) => (
          <li
            key={item}
            className="bn-pill inline-flex max-w-full items-center gap-2 text-[15px] font-medium leading-normal text-sage-gray-700"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-primary text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.42l2.793 2.794 6.793-6.794a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-9 sm:mt-10">
        <HeroActions />
      </div>

      <HeroStats />
    </div>
  );
});

export function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroGallerySlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-x-clip overflow-y-visible bg-white [overflow-anchor:none]">
      {/* Quiet background: warm two-tone split, a faint dot texture and a soft glow. */}
      <div className="absolute inset-0 bg-[linear-gradient(118deg,#fffaf8_0%,#fff5f4_44%,#ffffff_44%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#7a1015_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Brand geometric shapes */}
      <div className="pointer-events-none absolute -left-14 -top-14 hidden h-56 w-56 rotate-12 rounded-[2rem] border-[22px] border-sage-gold/22 md:block" />
      <div className="pointer-events-none absolute left-[6%] top-[55%] hidden h-36 w-36 rotate-45 rounded-[1.4rem] border-[14px] border-sage-primary/10 lg:block" />
      <div className="pointer-events-none absolute bottom-10 left-[38%] hidden h-20 w-20 -rotate-12 rounded-[1rem] bg-sage-primary/7 lg:block" />
      <div className="pointer-events-none absolute left-[46%] top-6 hidden h-8 w-8 rotate-45 rounded-md border-[6px] border-sage-gold/30 md:block" />

      {/* Soft radial glow (warms the left cream zone) ── */}
      <div className="pointer-events-none absolute -left-10 top-0 h-[70%] w-[45%] bg-[radial-gradient(ellipse_at_top_left,rgba(109,15,18,0.07),transparent_65%)]" />

      {/* ── Layer 5: Top & bottom gradient fades for clean edges ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/60 to-transparent" />

      {/* Top border */}
      <div className="absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-sage-red-100 to-transparent lg:block" />

      {/* Mobile: framed landscape photo card first */}
      <div className="relative z-10 px-4 pt-4 sm:px-6 sm:pt-6 lg:hidden">
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

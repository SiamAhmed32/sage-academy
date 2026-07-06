"use client";

import { heroGallerySlides } from "@/constants/hero";
import { HeroGalleryCard } from "@/components/home/HeroGalleryCard";

type HeroVisualProps = {
  activeIndex: number;
};

export function HeroVisual({ activeIndex }: HeroVisualProps) {
  const slide = heroGallerySlides[activeIndex];

  return (
    <div className="relative isolate mx-auto w-full lg:flex lg:h-[calc(100svh-11rem)] lg:min-h-[500px] lg:max-w-xl lg:items-center lg:justify-end xl:max-w-none">
      <div className="absolute right-5 top-8 -z-10 hidden h-[82%] w-[82%] rounded-[3rem] border border-sage-red-100/60 bg-white/60 lg:block" />
      <div className="absolute right-12 top-14 -z-10 hidden h-[76%] w-[78%] rounded-[3rem] bg-sage-primary/10 lg:block" />

      <div className="relative z-10 w-full lg:w-[94%] lg:max-w-[500px]">
        <HeroGalleryCard slide={slide} activeIndex={activeIndex} />
      </div>
    </div>
  );
}

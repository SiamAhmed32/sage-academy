"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { heroGallerySlides, type HeroGallerySlide } from "@/constants/hero";
import { cn } from "@/lib/utils";

type HeroGalleryCardProps = {
  slide: HeroGallerySlide;
  activeIndex: number;
};

function wrapIndex(index: number) {
  const length = heroGallerySlides.length;
  return ((index % length) + length) % length;
}

function getHeroImageClass(imageClass?: string, eyebrow?: string) {
  const isTeacher = eyebrow === "Teachers";
  const usesLowerFocus = imageClass?.includes("object-[72%");

  if (!isTeacher) {
    return "object-cover object-center";
  }

  return cn(
    "object-cover object-[center_12%] sm:object-[center_15%]",
    usesLowerFocus ? "lg:object-[72%_center]" : "lg:object-center"
  );
}

function SlideCaption({
  slide,
  activeIndex,
  className,
  tone = "light",
}: {
  slide: HeroGallerySlide;
  activeIndex: number;
  className?: string;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <AnimatePresence initial={false} mode="sync">
      <motion.div
        key={`hero-gallery-caption-${activeIndex}-${tone}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={className}
      >
        <div className="flex items-end justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.18em] sm:text-[11px]",
                isDark ? "text-sage-red-100/90" : "text-sage-gray-500"
              )}
            >
              {slide.eyebrow}
            </p>
            <h3
              className={cn(
                "bn-headline mt-1 text-lg font-bold leading-6 sm:text-xl lg:text-2xl lg:leading-8",
                isDark ? "text-white" : "text-sage-secondary"
              )}
            >
              {slide.title}
            </h3>
            <p
              className={cn(
                "bn-pill mt-1 text-sm font-semibold leading-normal",
                isDark ? "text-sage-red-100" : "text-sage-primary"
              )}
            >
              {slide.subtitle}
            </p>
          </div>
          <div
            className={cn(
              "inline-flex max-w-[8.5rem] shrink-0 items-center rounded-full px-3 py-1.5 text-[11px] font-bold leading-normal sm:max-w-[9rem] sm:py-2 sm:text-xs lg:max-w-none lg:px-3.5 lg:text-sm",
              isDark
                ? "border border-white/20 bg-white/15 text-white"
                : "bg-sage-red-50 text-sage-primary"
            )}
          >
            {slide.badge}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function HeroGalleryCard({ slide, activeIndex }: HeroGalleryCardProps) {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const visibleIndexes = useMemo(() => {
    const indexes = new Set<number>([
      0,
      activeIndex,
      wrapIndex(activeIndex - 1),
      wrapIndex(activeIndex + 1),
    ]);
    return [...indexes].sort((a, b) => a - b);
  }, [activeIndex]);

  useEffect(() => {
    visibleIndexes.forEach((index) => {
      const src = heroGallerySlides[index]?.image;
      if (!src) return;
      const img = new window.Image();
      img.src = encodeURI(src);
    });
  }, [visibleIndexes]);

  function markLoaded(src: string) {
    setLoadedImages((current) => (current[src] ? current : { ...current, [src]: true }));
  }

  const activeLoaded = loadedImages[slide.image];

  return (
    <div className="mx-auto w-full max-w-none overflow-hidden bg-white lg:max-w-none lg:rounded-[2.35rem] lg:shadow-xl lg:shadow-sage-red-100/40">
      <div className="relative h-[clamp(420px,68svh,580px)] w-full overflow-hidden bg-sage-red-50 sm:h-[clamp(440px,70svh,600px)] lg:aspect-[4/4.05] lg:h-auto lg:max-h-none">
        {!activeLoaded ? (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-sage-red-50 via-white to-sage-red-50" />
        ) : null}

        {visibleIndexes.map((index) => {
          const item = heroGallerySlides[index];
          const isActive = index === activeIndex;
          const isLoaded = loadedImages[item.image];
          const isPriority = index === 0 || index === activeIndex;

          return (
            <div
              key={item.image}
              aria-hidden={!isActive}
              className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-in-out",
                isActive && isLoaded ? "z-10 opacity-100" : "z-0 opacity-0"
              )}
            >
              <Image
                src={item.image}
                alt={isActive ? item.title : ""}
                fill
                priority={isPriority}
                loading={isPriority ? "eager" : "lazy"}
                sizes="100vw"
                className={getHeroImageClass(item.imageClass, item.eyebrow)}
                onLoad={() => markLoaded(item.image)}
              />
            </div>
          );
        })}
      </div>

      {/* Desktop: caption below image */}
      <div className="relative hidden min-h-[7.5rem] bg-white px-6 py-4 lg:block">
        <SlideCaption slide={slide} activeIndex={activeIndex} tone="light" className="absolute inset-x-6 inset-y-4" />
      </div>
    </div>
  );
}

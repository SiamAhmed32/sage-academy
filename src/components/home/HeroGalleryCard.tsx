"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

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

  function markLoaded(src: string) {
    setLoadedImages((current) => (current[src] ? current : { ...current, [src]: true }));
  }

  const activeLoaded = loadedImages[slide.image];

  return (
    <div className="mx-auto w-full max-w-none overflow-hidden rounded-[1.6rem] bg-white shadow-lg shadow-sage-red-100/60 ring-1 ring-sage-red-100/70 lg:max-w-none lg:rounded-[2.35rem] lg:shadow-xl lg:shadow-sage-red-100/40 lg:ring-0">
      {/* Phones get a landscape frame so the whole photo shows; desktop keeps the tall card. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sage-red-50 sm:aspect-[16/10] lg:aspect-[4/5]">
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
                // Only the first slide is needed for the first paint; the neighbours load quietly.
                priority={index === 0}
                loading={isPriority ? "eager" : "lazy"}
                sizes="(min-width: 1024px) 46vw, 100vw"
                className={getHeroImageClass(item.imageClass, item.eyebrow)}
                onLoad={() => markLoaded(item.image)}
              />
            </div>
          );
        })}

        {/* Mobile caption + slide dots */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-4 pb-3.5 pt-12 lg:hidden">
          <p className="min-w-0 truncate text-sm font-semibold text-white drop-shadow">{slide.title}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {heroGallerySlides.map((item, index) => (
              <span
                key={item.image}
                className={cn(
                  "h-1.5 rounded-full bg-white/60 transition-all duration-300",
                  index === activeIndex ? "w-5 bg-white" : "w-1.5"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

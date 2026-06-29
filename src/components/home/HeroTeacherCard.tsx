"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { heroTeachers } from "@/constants/hero";
import { cn } from "@/lib/utils";

type HeroTeacherCardProps = {
  teacher: (typeof heroTeachers)[number];
  activeTeacher: number;
};

function wrapIndex(index: number) {
  const length = heroTeachers.length;
  return ((index % length) + length) % length;
}

export function HeroTeacherCard({ teacher, activeTeacher }: HeroTeacherCardProps) {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const visibleIndexes = useMemo(() => {
    const indexes = new Set<number>([
      0,
      activeTeacher,
      wrapIndex(activeTeacher - 1),
      wrapIndex(activeTeacher + 1),
    ]);
    return [...indexes].sort((a, b) => a - b);
  }, [activeTeacher]);

  useEffect(() => {
    visibleIndexes.forEach((index) => {
      const src = heroTeachers[index]?.image;
      if (!src) return;
      const img = new window.Image();
      img.src = encodeURI(src);
    });
  }, [visibleIndexes]);

  function markLoaded(src: string) {
    setLoadedImages((current) => (current[src] ? current : { ...current, [src]: true }));
  }

  const activeLoaded = loadedImages[teacher.image];

  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-sage-red-100 lg:max-w-none lg:rounded-[2.35rem] lg:border lg:border-sage-red-100 lg:bg-sage-red-50 lg:shadow-2xl lg:shadow-sage-red-100/35 lg:ring-0">
      <div className="relative aspect-[1/1] w-full overflow-hidden bg-sage-red-50 lg:aspect-[4/4.05]">
        {!activeLoaded ? (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-sage-red-50 via-white to-sage-red-50" />
        ) : null}

        {visibleIndexes.map((index) => {
          const item = heroTeachers[index];
          const isActive = index === activeTeacher;
          const isLoaded = loadedImages[item.image];
          const isPriority = index === 0 || index === activeTeacher;

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
                alt={isActive ? item.name : ""}
                fill
                priority={isPriority}
                loading={isPriority ? "eager" : "lazy"}
                sizes="(max-width: 1024px) 100vw, 500px"
                className={item.imageClass}
                onLoad={() => markLoaded(item.image)}
              />
            </div>
          );
        })}
      </div>

      <div className="relative min-h-[7.75rem] border-t border-sage-red-100 bg-white px-5 py-4 lg:min-h-[7.5rem] sm:px-6">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={`hero-teacher-info-${activeTeacher}`}
            className="absolute inset-x-5 inset-y-4 sm:inset-x-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <div className="flex h-full items-end justify-between gap-4 sm:gap-6">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-gray-500 sm:text-[11px]">
                  Teachers
                </p>
                <h3 className="bn-headline mt-1 text-xl font-bold leading-7 text-sage-secondary lg:mt-1.5 lg:text-2xl lg:leading-8">
                  {teacher.name}
                </h3>
                <p className="bn-pill mt-1 text-sm font-semibold leading-normal text-sage-primary">
                  {teacher.subject}
                </p>
              </div>

              <div className="bn-pill inline-flex max-w-[9rem] shrink-0 items-center rounded-full border border-sage-red-100 bg-sage-red-50 px-3 py-2 text-xs font-bold leading-normal text-sage-primary lg:max-w-none lg:px-3.5 lg:text-sm">
                {teacher.experience}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

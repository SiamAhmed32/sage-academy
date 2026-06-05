"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import { heroTeachers } from "@/constants/hero";

type HeroVisualProps = {
  activeTeacher: number;
};

export function HeroVisual({ activeTeacher }: HeroVisualProps) {
  const teacher = heroTeachers[activeTeacher];

  return (
    <div className="relative isolate mx-auto hidden h-[calc(100svh-11rem)] min-h-[500px] w-full max-w-xl items-center justify-end lg:flex">
      <div className="absolute right-5 top-8 z-0 h-[82%] w-[82%] rounded-[3rem] border border-sage-red-100 bg-white/60" />
      <div className="absolute right-12 top-14 z-0 h-[76%] w-[78%] rounded-[3rem] bg-sage-primary/10" />

      <div className="relative z-10 w-[94%] max-w-[500px]">
        <div className="overflow-hidden rounded-[2.35rem] border border-sage-red-100 bg-sage-red-50 shadow-2xl shadow-sage-red-100/35">
          <div className="relative aspect-[4/4.05] w-full overflow-hidden bg-sage-red-50">
            <AnimatePresence initial={false}>
              <motion.div
                key={`hero-teacher-image-${activeTeacher}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
              >
                <Image
                  src={teacher.image}
                  alt={teacher.name}
                  fill
                  priority={activeTeacher === 0}
                  sizes="500px"
                  className={teacher.imageClass}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative min-h-[7.5rem] border-t border-sage-red-100 bg-white px-5 py-4 sm:px-6">
            <AnimatePresence initial={false} mode="sync">
              <motion.div
                key={`hero-teacher-info-${activeTeacher}`}
                className="absolute inset-x-5 inset-y-4 sm:inset-x-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <div className="flex h-full items-end justify-between gap-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sage-gray-500">
                      Teachers
                    </p>
                    <h3 className="mt-1.5 text-2xl font-bold leading-8 text-sage-secondary">
                      {teacher.name}
                    </h3>
                    <p className="mt-1 font-semibold text-sage-primary">{teacher.subject}</p>
                  </div>

                  <div className="inline-flex shrink-0 items-center rounded-full border border-sage-red-100 bg-sage-red-50 px-3.5 py-2 text-sm font-bold leading-5 text-sage-primary">
                    {teacher.experience}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

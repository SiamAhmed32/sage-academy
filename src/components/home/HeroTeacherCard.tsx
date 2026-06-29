"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import { heroTeachers } from "@/constants/hero";

type HeroTeacher = (typeof heroTeachers)[number];

type HeroTeacherCardProps = {
  teacher: HeroTeacher;
  activeTeacher: number;
  variant?: "mobile" | "desktop";
};

export function HeroTeacherCard({
  teacher,
  activeTeacher,
  variant = "desktop",
}: HeroTeacherCardProps) {
  const isMobile = variant === "mobile";

  return (
    <div
      className={
        isMobile
          ? "mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-sage-red-100"
          : "overflow-hidden rounded-[2.35rem] border border-sage-red-100 bg-sage-red-50 shadow-2xl shadow-sage-red-100/35"
      }
    >
      <div
        className={`relative w-full overflow-hidden bg-sage-red-50 ${
          isMobile ? "aspect-[1/1]" : "aspect-[4/4.05]"
        }`}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={`hero-teacher-image-${variant}-${activeTeacher}`}
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
              sizes={isMobile ? "(max-width: 1024px) 100vw, 500px" : "500px"}
              className={teacher.imageClass}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className={`relative border-t border-sage-red-100 bg-white ${
          isMobile ? "min-h-[7.75rem] px-5 py-4" : "min-h-[7.5rem] px-5 py-4 sm:px-6"
        }`}
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={`hero-teacher-info-${variant}-${activeTeacher}`}
            className={`absolute inset-x-5 inset-y-4 ${isMobile ? "" : "sm:inset-x-6"}`}
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
                <h3
                  className={`bn-headline mt-1 font-bold text-sage-secondary ${
                    isMobile ? "text-xl leading-7" : "mt-1.5 text-2xl leading-8"
                  }`}
                >
                  {teacher.name}
                </h3>
                <p className="bn-pill mt-1 text-sm font-semibold leading-normal text-sage-primary">
                  {teacher.subject}
                </p>
              </div>

              <div
                className={`bn-pill inline-flex shrink-0 items-center rounded-full border border-sage-red-100 bg-sage-red-50 text-sage-primary ${
                  isMobile
                    ? "max-w-[9rem] px-3 py-2 text-xs font-bold leading-normal"
                    : "px-3.5 py-2 text-sm font-bold leading-normal"
                }`}
              >
                {teacher.experience}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

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
    <div className="relative isolate mx-auto hidden h-[calc(100svh-9rem)] min-h-[520px] w-full max-w-2xl lg:block">
      {/* Floating stat card — top right */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-4 top-4 z-40 rounded-2xl border border-white/30 bg-white/70 px-5 py-4 shadow-2xl shadow-black/10 backdrop-blur-xl"
      >
        <h3 className="text-3xl font-bold text-sage-secondary">১৫+</h3>
        <p className="text-sm font-medium text-sage-gray-500">অভিজ্ঞ শিক্ষক</p>
      </motion.div>

      {/* Floating stat card — mid left */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-44 left-0 z-40 rounded-2xl border border-white/30 bg-white/70 px-5 py-4 shadow-2xl shadow-black/10 backdrop-blur-xl"
      >
        <h3 className="text-3xl font-bold text-sage-secondary">সাপ্তাহিক</h3>
        <p className="text-sm font-medium text-sage-gray-500">
          পরীক্ষা ও মূল্যায়ন
        </p>
      </motion.div>

      {/* Background blobs */}
      <div className="absolute right-0 top-10 z-0 h-[82%] max-h-[520px] w-[82%] max-w-[520px] rounded-full bg-sage-primary/10" />
      <div className="absolute right-44 top-36 z-0 size-72 rounded-full bg-sage-secondary/10" />

      <AnimatePresence mode="popLayout">
        {/* Main image */}
        <motion.div
          key={`hero-image-${activeTeacher}`}
          initial={{ opacity: 0, scale: 0.98, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.98, x: -40 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 right-0 z-20 h-full max-h-[620px] w-[95%] max-w-[545px] overflow-hidden rounded-[3rem] bg-sage-red-50 shadow-2xl ring-1 ring-sage-red-100"
        >
          <Image
            src={teacher.image}
            alt={teacher.name}
            fill
            priority
            sizes="545px"
            className={teacher.imageClass}
          />
          {/* Subtle bottom gradient for text legibility */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/40 via-black/15 to-transparent" />
        </motion.div>

        {/* Teacher info card — glassmorphic overlay at bottom */}
        <motion.div
          key={`hero-card-${activeTeacher}`}
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 24 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-6 right-6 z-50 w-80 overflow-hidden rounded-2xl border border-white/25 bg-white/15 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <h3 className="text-xl font-bold text-white drop-shadow-sm">{teacher.name}</h3>
          <p className="mt-1 font-semibold text-sage-red-100">{teacher.subject}</p>
          <p className="mt-2 text-sm text-white/80">{teacher.experience}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { HiOutlineAcademicCap, HiOutlineClock } from "react-icons/hi2";

import type { Teacher } from "@/types/teacher";

type TeacherCardProps = {
  teacher: Teacher;
  index: number;
};

export function TeacherCard({ teacher, index }: TeacherCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="relative pb-8"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-sage-red-100">
        <Image
          src={teacher.image || "/images/placeholder-teacher.jpg"}
          alt={teacher.name}
          fill
          className="object-cover object-center"
        />
      </div>

      <div className="relative z-10 mx-6 -mt-20 flex min-h-56 flex-col rounded-[1.4rem] bg-sage-primary px-5 py-5 text-sage-white sm:px-6 sm:py-6">
        <h3 className="line-clamp-2 min-h-[3.8rem] text-[1.7rem] font-bold leading-tight">
          {teacher.name}
        </h3>
        <p className="mt-1.5 line-clamp-1 min-h-6 text-base font-medium text-sage-red-100">
          {teacher.designation}
        </p>
        <div className="mt-4 space-y-2.5 text-sm">
          <div className="flex items-center gap-3">
            <HiOutlineAcademicCap size={17} />
            <span>{teacher.subject}</span>
          </div>
          <div className="flex items-center gap-3">
            <HiOutlineClock size={17} />
            <span>{teacher.experience}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

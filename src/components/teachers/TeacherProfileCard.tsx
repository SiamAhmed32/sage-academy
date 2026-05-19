"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import type { Teacher } from "@/types/teacher";

type TeacherProfileCardProps = {
  teacher: Teacher;
  index: number;
};

export function TeacherProfileCard({ teacher, index }: TeacherProfileCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-[0_8px_16px_rgba(109,15,18,0.05)] overflow-hidden group hover:shadow-[0_16px_32px_rgba(109,15,18,0.08)] transition-all duration-300 border border-transparent hover:border-sage-primary/5"
    >
      {/* Teacher Image */}
      <div className="h-64 overflow-hidden relative">
        <Image
          src={teacher.image || "/images/placeholder-teacher.jpg"}
          alt={teacher.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105 object-center"
          sizes="(max-width: 768px) 100vw, 300px"
        />
      </div>

      {/* Card Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-sage-primary mb-1 tracking-tight">
          {teacher.name}
        </h3>
        <p className="text-sage-gray-700 text-sm mb-0.5 font-medium">
          {teacher.subject}
        </p>
        <p className="text-sage-gray-600 text-[13px] mb-0.5">
          {teacher.designation}
        </p>
        <p className="text-sage-primary text-[12px] font-bold uppercase tracking-wider mb-4 opacity-80">
          {teacher.experience}
        </p>
        
        {/* Teacher Quote */}
        {teacher.quote && (
          <div className="relative pt-4 border-t border-sage-red-100/50">
            <p className="italic text-sage-gray-700/80 text-sm leading-relaxed border-l-2 border-sage-primary/30 pl-4">
              &ldquo;{teacher.quote}&rdquo;
            </p>
          </div>
        )}
      </div>
    </motion.article>
  );
}


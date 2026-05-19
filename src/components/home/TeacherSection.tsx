"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { TeacherCard } from "@/components/home/TeacherCard";
import { Container } from "@/components/shared/Container";
import { teachersSectionContent } from "@/constants/teachers";
import type { Teacher } from "@/types/teacher";

export function TeacherSection() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const response = await fetch("/api/teachers");
        const data = await response.json();
        if (data.success) {
          // Backend already sorts by isFeatured: -1, order: 1, createdAt: 1
          setTeachers(data.data.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeachers();
  }, []);

  if (!isLoading && teachers.length === 0) return null;

  return (
    <section className="bg-sage-white py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sage-primary">
                {teachersSectionContent.badge}
              </p>
              <span className="h-px w-24 bg-sage-primary/25" />
            </div>

            <h2 className="mt-4 text-3xl font-bold leading-[1.1] text-sage-secondary sm:text-4xl lg:text-[3.5rem]">
              {teachersSectionContent.titleStart}{" "}
              <span className="text-sage-primary underline decoration-sage-primary decoration-4 underline-offset-6">
                {teachersSectionContent.titleAccent}
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-sage-gray-700 sm:text-lg">
              {teachersSectionContent.description}
            </p>
          </div>

          <Link
            href="/teachers"
            className="group inline-flex items-center gap-2 rounded-full border border-sage-primary/20 bg-white px-6 py-3 text-sm font-bold text-sage-primary transition-all hover:bg-sage-primary hover:text-white"
          >
            সব শিক্ষক দেখুন
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-14 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[400px] animate-pulse rounded-[1.75rem] bg-sage-red-50/50" />
              ))
            : teachers.map((teacher, index) => (
                <TeacherCard key={teacher._id} teacher={teacher} index={index} />
              ))}
        </div>
      </Container>
    </section>
  );
}

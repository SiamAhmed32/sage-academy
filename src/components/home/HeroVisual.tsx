"use client";

import { heroTeachers } from "@/constants/hero";
import { HeroTeacherCard } from "@/components/home/HeroTeacherCard";

type HeroVisualProps = {
  activeTeacher: number;
};

export function HeroVisual({ activeTeacher }: HeroVisualProps) {
  const teacher = heroTeachers[activeTeacher];

  return (
    <div className="relative isolate mx-auto w-full max-w-xl lg:flex lg:h-[calc(100svh-11rem)] lg:min-h-[500px] lg:items-center lg:justify-end">
      <div className="absolute right-5 top-8 -z-10 hidden h-[82%] w-[82%] rounded-[3rem] border border-sage-red-100 bg-white/60 lg:block" />
      <div className="absolute right-12 top-14 -z-10 hidden h-[76%] w-[78%] rounded-[3rem] bg-sage-primary/10 lg:block" />

      <div className="relative z-10 w-full lg:w-[94%] lg:max-w-[500px]">
        <HeroTeacherCard teacher={teacher} activeTeacher={activeTeacher} />
      </div>
    </div>
  );
}

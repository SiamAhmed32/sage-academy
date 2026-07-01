import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ExamProgramCard } from "@/components/exam-hub/ExamProgramCard";
import { Container } from "@/components/shared/Container";
import { serializePublicProgram } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";

export async function ExamHubHomeSection() {
  await connectDB();

  const programs = await ExamProgram.find({ status: "published" })
    .sort({ featured: -1, order: 1, startDate: 1 })
    .limit(4)
    .lean();

  if (programs.length === 0) return null;

  const serialized = programs.map((program) =>
    serializePublicProgram(program as Record<string, unknown>)
  );

  return (
    <section className="border-y border-sage-border bg-gradient-to-b from-sage-red-50/80 to-sage-white py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-sage-primary ring-1 ring-sage-red-100">
              SAGE Exam Hub
            </p>
            <h2 className="mt-4 text-3xl font-bold text-sage-secondary sm:text-4xl">
              অনলাইন ও অফলাইন পরীক্ষা
            </h2>
            <p className="mt-4 text-base leading-8 text-sage-gray-700">
              সাপ্তাহিক/মাসিক অফলাইন পরীক্ষা, পাবলিক অনলাইন MCQ এবং প্রাইভেট পেইড
              পরীক্ষা — সব এক জায়গায়।
            </p>
          </div>

          <Link
            href="/exams"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sage-primary px-6 py-4 text-base font-bold text-white shadow-lg shadow-sage-primary/25 transition hover:bg-sage-secondary lg:w-auto lg:rounded-full lg:px-5 lg:py-2.5 lg:text-sm"
          >
            সব পরীক্ষা দেখুন
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {serialized.map((program, index) => (
            <ExamProgramCard key={program.slug} program={program} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}

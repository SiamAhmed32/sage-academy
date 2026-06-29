import Link from "next/link";
import { ArrowUpRight, FileCheck2 } from "lucide-react";

import type { StudentExamResultRow } from "@/lib/exam-hub-student";

type Props = {
  results: StudentExamResultRow[];
  phone?: string;
};

export function StudentExamResultsList({ results, phone }: Props) {
  if (!phone) {
    return (
      <section className="rounded-xl border border-sage-border bg-white p-5 shadow-sm sm:p-6">
        <EmptyState message="আপনার প্রোফাইলে মোবাইল নম্বর নেই। প্রোফাইল আপডেট করলে Exam Hub ফলাফল এখানে দেখাবে।" />
      </section>
    );
  }

  if (!results.length) {
    return (
      <section className="rounded-xl border border-sage-border bg-white p-5 shadow-sm sm:p-6">
        <EmptyState message="এখনো কোনো অনলাইন Exam Hub ফলাফল নেই। /exams থেকে পরীক্ষা দিলে এখানে দেখাবে।" />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-sage-border bg-white p-5 shadow-sm sm:p-6">
      <header className="flex items-center gap-3">
        <span className="rounded-xl bg-sage-red-50 p-3 text-sage-primary">
          <FileCheck2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-sage-secondary">Exam Hub ফলাফল</h2>
          <p className="mt-1 text-sm text-sage-gray-500">অনলাইন MCQ পরীক্ষার জমা দেওয়া ফলাফল</p>
        </div>
      </header>

      <div className="mt-5 space-y-3">
        {results.map((row) => {
          const pct = row.totalMarks ? Math.round((row.score / row.totalMarks) * 100) : 0;
          const submitted = new Date(row.submittedAt).toLocaleString("en-BD", {
            dateStyle: "medium",
            timeStyle: "short",
          });

          return (
            <div
              key={row.attemptId}
              className="flex flex-col gap-3 rounded-xl border border-sage-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-sage-secondary">{row.title}</p>
                <p className="mt-1 text-sm text-sage-gray-500">{submitted}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl bg-sage-red-50 px-4 py-2 text-center">
                  <p className="text-lg font-black text-sage-primary">
                    {row.score}/{row.totalMarks}
                  </p>
                  <p className="text-xs font-semibold text-sage-gray-500">{pct}%</p>
                </div>
                {row.programSlug ? (
                  <Link
                    href={`/student/results/exam/${row.attemptId}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-sage-primary px-4 py-2 text-sm font-bold text-white hover:bg-sage-secondary"
                  >
                    বিস্তারিত
                    <ArrowUpRight className="size-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <>
      <header className="flex items-center gap-3">
        <span className="rounded-xl bg-sage-red-50 p-3 text-sage-primary">
          <FileCheck2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-sage-secondary">ফলাফল</h2>
          <p className="mt-1 text-sm text-sage-gray-500">Exam Hub ও ভবিষ্যৎ পরীক্ষার ফলাফল</p>
        </div>
      </header>
      <p className="mt-5 rounded-xl border border-dashed border-sage-border p-8 text-center text-sm font-semibold text-sage-gray-500">
        {message}
      </p>
    </>
  );
}

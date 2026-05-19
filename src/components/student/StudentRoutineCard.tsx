import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

type RoutineItem = {
  dayBn: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
};

type StudentRoutineCardProps = {
  routine: RoutineItem[];
  limit?: number;
  viewAllHref?: string;
};

export function StudentRoutineCard({ routine, limit, viewAllHref }: StudentRoutineCardProps) {
  const preview = limit ? routine.slice(0, limit) : routine;

  return (
    <section className="rounded-xl border border-sage-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-sage-secondary">সাপ্তাহিক রুটিন</h2>
          <p className="mt-1 text-sm text-sage-gray-500">আপনার ভর্তি করা বিষয় অনুযায়ী রুটিন।</p>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="inline-flex items-center gap-1 text-sm font-bold text-sage-primary">
            সব দেখুন <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {preview.length ? (
          preview.map((item) => (
            <div
              key={`${item.dayBn}-${item.subjectName}-${item.startTime}`}
              className="rounded-xl border border-sage-border p-4 transition hover:border-sage-primary/20 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-sage-primary">{item.dayBn}</p>
                <p className="flex items-center gap-1 text-sm font-semibold text-sage-gray-500">
                  <Clock className="h-4 w-4" />
                  {item.startTime} – {item.endTime}
                </p>
              </div>
              <h3 className="mt-3 text-lg font-bold text-sage-secondary">{item.subjectName}</h3>
              <p className="mt-1 text-sm text-sage-gray-500">{item.teacherName}</p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-sage-border p-6 text-center text-sm font-semibold text-sage-gray-500 md:col-span-2">
            এখনও কোনো রুটিন যুক্ত নেই।
          </div>
        )}
      </div>
    </section>
  );
}

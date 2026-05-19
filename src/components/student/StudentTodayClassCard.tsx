import Link from "next/link";
import { ArrowRight, Clock, Video } from "lucide-react";

type ClassItem = {
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
};

export function StudentTodayClassCard({ classes }: { classes: ClassItem[] }) {
  return (
    <section className="rounded-xl border border-sage-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-sage-secondary">আজকের ক্লাস</h2>
          <p className="mt-1 text-sm text-sage-gray-500">আজ কোন বিষয়ে কখন ক্লাস হবে।</p>
        </div>
        <span className="rounded-full bg-sage-red-50 px-3 py-1.5 text-sm font-bold text-sage-primary">
          {classes.length} টি
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {classes.length ? (
          classes.map((item) => (
            <div
              key={`${item.subjectName}-${item.startTime}`}
              className="rounded-xl border border-sage-border bg-gradient-to-r from-sage-red-50/60 to-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-sage-secondary">{item.subjectName}</h3>
                  <p className="mt-1 text-sm font-medium text-sage-gray-600">{item.teacherName}</p>
                </div>
                <p className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-sage-primary ring-1 ring-sage-red-100">
                  <Clock className="h-4 w-4" />
                  {item.startTime} – {item.endTime}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-sage-border p-8 text-center">
            <Video className="mx-auto h-8 w-8 text-sage-gray-400" />
            <p className="mt-3 text-sm font-semibold text-sage-gray-600">আজ কোনো ক্লাস নেই।</p>
            <Link
              href="/student/routine"
              className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-sage-primary"
            >
              পুরো রুটিন দেখুন <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

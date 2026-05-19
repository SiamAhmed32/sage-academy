import { BookOpen, Clock, UserRound } from "lucide-react";

type RoutineItem = {
  dayBn: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
};

export function StudentRoutineTimeline({ classes }: { classes: RoutineItem[] }) {
  if (!classes.length) {
    return (
      <div className="rounded-xl border border-dashed border-sage-border bg-white px-4 py-12 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-sage-gray-300" />
        <h3 className="font-bold text-sage-secondary">এই দিনে কোনো ক্লাস নেই</h3>
        <p className="mt-1 text-sm text-sage-gray-500">
          আপনার ভর্তি করা বিষয় অনুযায়ী এই দিনে ক্লাস নির্ধারিত নেই।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {classes.map((item) => (
        <article
          key={`${item.dayBn}-${item.subjectName}-${item.startTime}`}
          className="flex flex-col gap-4 rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-sage-primary">{item.dayBn}</p>
            <h3 className="mt-1 text-xl font-black text-sage-secondary">{item.subjectName}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-sage-gray-600">
              <UserRound className="h-4 w-4" />
              {item.teacherName}
            </p>
          </div>
          <p className="inline-flex items-center gap-2 rounded-lg bg-sage-red-50 px-4 py-2 text-sm font-black text-sage-primary">
            <Clock className="h-4 w-4" />
            {item.startTime} – {item.endTime}
          </p>
        </article>
      ))}
    </div>
  );
}

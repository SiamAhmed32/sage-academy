import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { StudentRoutineDayTabs } from "@/components/student/StudentRoutineDayTabs";
import { StudentRoutineTimeline } from "@/components/student/StudentRoutineTimeline";
import { buildStudentRoutine, getStudentContext, studentDays } from "@/lib/student-dashboard";

type RoutinePageProps = {
  searchParams: Promise<{ day?: string }>;
};

export default async function StudentRoutinePage({ searchParams }: RoutinePageProps) {
  const ctx = await getStudentContext();
  if ("problem" in ctx) return null;

  const params = await searchParams;
  const routine = buildStudentRoutine(ctx.student);
  const todayEn = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayBn = studentDays.find((day) => day.en === todayEn)?.bn ?? studentDays[0].bn;
  const selectedDayBn =
    studentDays.find((day) => day.bn === params.day)?.bn ?? todayBn;
  const dayClasses = routine.filter((item) => item.dayBn === selectedDayBn);
  const batchLabel = [ctx.student.batch?.title, ctx.student.batch?.batchCode].filter(Boolean).join(" · ");
  const routineNote = ctx.student.batch?.routineNote?.trim();

  return (
    <section className="space-y-6">
      <StudentPageHeader
        title="ক্লাস রুটিন"
        description={
          batchLabel
            ? `${batchLabel} — সাপ্তাহিক ক্লাসের সময়সূচি। দিন বেছে নিয়ে বিস্তারিত দেখুন।`
            : "আপনার ব্যাচের সাপ্তাহিক ক্লাসের সময়সূচি। দিন বেছে নিয়ে বিস্তারিত দেখুন।"
        }
      />
      {routineNote ? (
        <div className="rounded-xl border border-sage-red-100 bg-sage-red-50/60 px-4 py-3 text-sm font-medium text-sage-gray-700">
          {routineNote}
        </div>
      ) : null}
      {!routine.length ? (
        <div className="rounded-xl border border-dashed border-sage-border bg-white px-4 py-8 text-center text-sm text-sage-gray-600">
          এখনো এই ব্যাচের রুটিন সেট করা হয়নি। অ্যাডমিন প্যানেলে ব্যাচ → রুটিন থেকে বিষয়, দিন ও সময় যোগ করলে এখানে দেখা যাবে।
        </div>
      ) : null}
      <StudentRoutineDayTabs selectedDayBn={selectedDayBn} />
      <StudentRoutineTimeline classes={dayClasses} />
    </section>
  );
}

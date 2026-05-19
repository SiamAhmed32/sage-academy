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

  return (
    <section className="space-y-6">
      <StudentPageHeader
        title="ক্লাস রুটিন"
        description="আপনার ভর্তি করা বিষয় অনুযায়ী সাপ্তাহিক ক্লাসের সময়সূচি। দিন বেছে নিয়ে বিস্তারিত দেখুন।"
      />
      <StudentRoutineDayTabs selectedDayBn={selectedDayBn} />
      <StudentRoutineTimeline classes={dayClasses} />
    </section>
  );
}

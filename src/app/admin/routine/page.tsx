import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RoutineDayTabs } from "@/components/admin/routine/RoutineDayTabs";
import { RoutineSummary } from "@/components/admin/routine/RoutineSummary";
import { RoutineTimeline } from "@/components/admin/routine/RoutineTimeline";
import { getRoutineClasses, getRoutineDay } from "@/lib/admin-routine";

type PageProps = {
  searchParams: Promise<{ day?: string }>;
};

export default async function AdminRoutinePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedDay = getRoutineDay(params.day);
  const classes = await getRoutineClasses(selectedDay);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="ক্লাস রুটিন"
        description="একাডেমিক ব্যাচের subject routine থেকে দিন অনুযায়ী ক্লাস তালিকা দেখুন। সময়, ব্যাচ, বিষয়, শিক্ষক ও সিট একই জায়গায় রাখা হয়েছে।"
      />

      <RoutineDayTabs selectedDay={selectedDay} />
      <RoutineSummary day={selectedDay} classes={classes} />
      <RoutineTimeline classes={classes} />
    </div>
  );
}

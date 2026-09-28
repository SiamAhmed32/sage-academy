import { TimetableLive } from "@/components/admin/academy/TimetableLive";
import { PageHeading } from "@/components/admin/sa/ui";

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ batch?: string; teacher?: string }> }) {
  const params = await searchParams;

  return (
    <div>
      <PageHeading
        eyebrow="Academics"
        title="Class routine"
        description="Every batch's weekly classes, Saturday to Thursday. Pick a batch, teacher or room to see just theirs. Click a class to open that batch's routine and change it."
      />
      <TimetableLive initialBatch={params.batch ?? ""} initialTeacher={params.teacher ?? ""} />
    </div>
  );
}

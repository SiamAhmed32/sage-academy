import { QuizLeadsGrid } from "@/components/admin/grids/QuizLeadsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { quizClassOptions, quizLeadTiles } from "@/lib/grid/tiles-leads";

export const dynamic = "force-dynamic";

export default async function AdminQuizLeadsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [params, tiles, classOptions] = await Promise.all([searchParams, quizLeadTiles(), quizClassOptions()]);

  return (
    <div>
      <PageHeading title="Quiz Lead Management" description="Review quiz participants, results, and follow-up status." />
      <QuizLeadsGrid tiles={tiles} classOptions={classOptions} initialSearch={params.q ?? ""} />
    </div>
  );
}

import { AssessmentCreateButton, AssessmentsGrid } from "@/components/admin/grids/AssessmentsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { examTiles } from "@/lib/grid/tiles-assessments";

export default async function AdminExamsPage() {
  const tiles = await examTiles();

  return (
    <div>
      <PageHeading
        title="Exams"
        description="Manage half-yearly, pre-test, final, board-prep, and regular exams as separate programs."
        actions={<AssessmentCreateButton kind="exam" />}
      />
      <AssessmentsGrid kind="exam" tiles={tiles} />
    </div>
  );
}

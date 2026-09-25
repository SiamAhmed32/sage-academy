import { AssessmentCreateButton, AssessmentsGrid } from "@/components/admin/grids/AssessmentsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { modelTestTiles } from "@/lib/grid/tiles-assessments";

export default async function AdminModelTestsPage() {
  const tiles = await modelTestTiles();

  return (
    <div>
      <PageHeading
        title="Model Tests"
        description="Manage scheduled model tests by class, subject, school focus, fees, and solve class."
        actions={<AssessmentCreateButton kind="modelTest" />}
      />
      <AssessmentsGrid kind="modelTest" tiles={tiles} />
    </div>
  );
}

import { AssessmentRegistrationsGrid } from "@/components/admin/grids/AssessmentRegistrationsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { assessmentRegistrationOptions, assessmentRegistrationTiles } from "@/lib/grid/tiles-leads";

export const dynamic = "force-dynamic";

export default async function AdminAssessmentRegistrationsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [params, tiles, options] = await Promise.all([searchParams, assessmentRegistrationTiles(), assessmentRegistrationOptions()]);

  return (
    <div>
      <PageHeading
        title="Model Test and Exam Registrations"
        description="Review and follow up on model-test and exam registrations as individual leads."
      />
      <AssessmentRegistrationsGrid
        tiles={tiles}
        assessmentTypes={options.assessmentTypes}
        classLabels={options.classLabels}
        initialSearch={params.q ?? ""}
      />
    </div>
  );
}

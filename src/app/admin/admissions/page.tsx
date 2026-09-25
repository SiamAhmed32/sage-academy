import { Metadata } from "next";

import { AdmissionsGrid } from "@/components/admin/grids/AdmissionsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { admissionTiles } from "@/lib/grid/tiles-leads";
import { canDeleteRecords, requireAdminPageUser } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Admission Management | SAGE Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdmissionPage({ searchParams }: { searchParams: Promise<{ q?: string; search?: string }> }) {
  const [params, user, tiles] = await Promise.all([searchParams, requireAdminPageUser(), admissionTiles()]);

  return (
    <div>
      <PageHeading title="Admission Applications" description="Manage SAGE Academy admission applications: follow up, comment, archive and restore." />
      <AdmissionsGrid tiles={tiles} canDelete={canDeleteRecords(user.role)} initialSearch={params.q ?? params.search ?? ""} />
    </div>
  );
}

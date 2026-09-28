import { Metadata } from "next";

import { AdmissionsGrid } from "@/components/admin/grids/AdmissionsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { getNavbarAuthUser } from "@/lib/auth-session";
import { canDeleteRecords } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Admission Management | SAGE Admin",
};

export default async function AdmissionPage({ searchParams }: { searchParams: Promise<{ q?: string; search?: string }> }) {
  const [params, user] = await Promise.all([searchParams, getNavbarAuthUser()]);

  return (
    <div>
      <PageHeading title="Admission Applications" description="Manage SAGE Academy admission applications: follow up, comment, archive and restore." />
      <AdmissionsGrid canDelete={canDeleteRecords(user?.role ?? "manager")} initialSearch={params.q ?? params.search ?? ""} />
    </div>
  );
}

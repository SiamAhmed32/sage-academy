import { ContactsGrid } from "@/components/admin/grids/ContactsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { contactTiles } from "@/lib/grid/tiles-leads";
import { canDeleteRecords, requireAdminPageUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [params, user, tiles] = await Promise.all([searchParams, requireAdminPageUser(), contactTiles()]);

  return (
    <div>
      <PageHeading
        title="Contact Messages"
        description="Review and follow up on messages submitted through the homepage contact form."
      />
      <ContactsGrid tiles={tiles} canDelete={canDeleteRecords(user.role)} initialSearch={params.q ?? ""} />
    </div>
  );
}

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EngagementAdminClient } from "@/components/admin/engagement/EngagementAdminClient";
import { getEngagementAnalytics } from "@/lib/engagement-analytics-server";

const RANGE_DAYS = 14;

export default async function AdminEngagementPage() {
  const analytics = await getEngagementAnalytics(RANGE_DAYS);
  const safe = JSON.parse(JSON.stringify(analytics)) as typeof analytics;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Visitor Activity"
        description="See important website actions such as viewing admission pages, starting an admission form, or clicking key calls to action."
      />
      <EngagementAdminClient analytics={safe} days={RANGE_DAYS} />
    </div>
  );
}

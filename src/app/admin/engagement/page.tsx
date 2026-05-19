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
        title="ভিজিটর অ্যাক্টিভিটি"
        description="ওয়েবসাইটে কে কোন গুরুত্বপূর্ণ কাজ করছে তা সহজ ভাষায় দেখুন: ভর্তি পেজ দেখা, ভর্তি ফর্ম শুরু করা, বা গুরুত্বপূর্ণ বাটনে ক্লিক করা।"
      />
      <EngagementAdminClient analytics={safe} days={RANGE_DAYS} />
    </div>
  );
}

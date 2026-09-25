import { BellRing, CalendarClock, CreditCard, GraduationCap, Megaphone } from "lucide-react";

import { EmptyState, PageHeading, Panel, StatusChip } from "@/components/admin/sa/ui";
import { formatDate } from "@/lib/academy/codes";
import { getPortalNotices, getPortalStudent } from "@/lib/academy/portal";

const TYPE: Record<string, { label: string; tone: 1 | 2 | 3 | 4 | 5; icon: typeof BellRing }> = {
  general: { label: "সাধারণ", tone: 2, icon: Megaphone },
  class: { label: "ক্লাস", tone: 1, icon: GraduationCap },
  batch: { label: "ব্যাচ", tone: 4, icon: BellRing },
  exam: { label: "পরীক্ষা", tone: 3, icon: CalendarClock },
  payment: { label: "পেমেন্ট", tone: 5, icon: CreditCard },
};

export default async function StudentNoticesPage() {
  const { detail } = await getPortalStudent();
  if (!detail) return null;
  const notices = await getPortalNotices(detail, 50);

  return (
    <div>
      <PageHeading
        eyebrow="Student workspace"
        title="নোটিশ"
        description={`${detail.student.className} ও ${detail.student.name}-এর ব্যাচের সব নোটিশ।`}
      />
      <Panel title="সব নোটিশ" description={`${notices.length}টি নোটিশ`}>
        {notices.length === 0 ? (
          <EmptyState icon={BellRing} title="এখনো কোনো নোটিশ নেই" description="নতুন নোটিশ এলে এখানে দেখা যাবে।" />
        ) : (
          <div className="panel-body" style={{ paddingTop: 0 }}>
            {notices.map((notice) => {
              const meta = TYPE[notice.type] ?? TYPE.general;
              const Icon = meta.icon;
              return (
                <article key={notice.id} className="notice-card">
                  <span className={`course-icon tone-${meta.tone}`}>
                    <Icon size={17} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h3>{notice.title}</h3>
                    <div className="notice-meta">
                      <StatusChip tone="info">{meta.label}</StatusChip>
                      <span>{formatDate(notice.publishedAt)}</span>
                      {notice.target ? <code>{notice.target}</code> : null}
                      {notice.examDate ? <span>পরীক্ষা: {formatDate(notice.examDate)}</span> : null}
                    </div>
                    {notice.topic ? <p><strong>বিষয়:</strong> {notice.topic}</p> : null}
                    {notice.details ? <p>{notice.details}</p> : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

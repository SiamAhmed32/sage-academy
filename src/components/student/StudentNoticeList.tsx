import Link from "next/link";
import { ArrowRight, BellRing, CalendarDays, Inbox } from "lucide-react";

const noticeTypeLabel: Record<string, string> = {
  general: "সাধারণ",
  class: "ক্লাস",
  batch: "ব্যাচ",
  exam: "পরীক্ষা",
  payment: "পেমেন্ট",
};

type NoticeItem = {
  _id: string;
  title: string;
  topic?: string;
  details?: string;
  examDate?: string;
  type?: string;
  publishedAt?: string;
};

type StudentNoticeListProps = {
  notices: NoticeItem[];
  limit?: number;
  viewAllHref?: string;
  variant?: "card" | "page";
  studentBatchCode?: string;
};

function formatNoticeDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
}

export function StudentNoticeList({
  notices,
  limit,
  viewAllHref,
  variant = "card",
  studentBatchCode,
}: StudentNoticeListProps) {
  const items = limit ? notices.slice(0, limit) : notices;
  const isPage = variant === "page";

  return (
    <section className={isPage ? "space-y-4" : "rounded-xl border border-sage-border bg-white p-5 shadow-sm sm:p-6"}>
      {!isPage && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-sage-red-50 p-3 text-sage-primary">
              <BellRing className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-sage-secondary">নোটিশ ও পরীক্ষা</h2>
              <p className="mt-1 text-sm text-sage-gray-500">ক্লাস, পরীক্ষা ও গুরুত্বপূর্ণ আপডেট।</p>
            </div>
          </div>
          {viewAllHref && (
            <Link href={viewAllHref} className="inline-flex items-center gap-1 text-sm font-bold text-sage-primary">
              সব দেখুন <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      <div className={isPage ? "space-y-4" : "mt-5 space-y-3"}>
        {items.length ? (
          items.map((notice) => (
            <article
              key={notice._id}
              className="overflow-hidden rounded-xl border border-sage-border bg-white shadow-sm transition hover:border-sage-primary/20"
            >
              <div className="border-b border-sage-border bg-sage-red-50/30 px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-sage-secondary">{notice.title}</h3>
                    {notice.type && (
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-sage-primary ring-1 ring-sage-red-100">
                        {noticeTypeLabel[notice.type] ?? notice.type}
                      </span>
                    )}
                  </div>
                  {formatNoticeDate(notice.examDate) && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-sage-gray-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatNoticeDate(notice.examDate)}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2 px-5 py-4">
                {notice.topic && (
                  <p className="text-sm font-semibold text-sage-primary">বিষয়: {notice.topic}</p>
                )}
                {notice.details && (
                  <p className="text-sm leading-7 text-sage-gray-700">{notice.details}</p>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-sage-border bg-white px-6 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-red-50 text-sage-primary">
              <Inbox className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-sage-secondary">এখন কোনো নোটিশ নেই</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-sage-gray-500">
              {studentBatchCode
                ? `আপনার ব্যাচ ${studentBatchCode}-এর জন্য পাঠানো নোটিশ এখানে দেখা যাবে। অন্য ব্যাচের নোটিশ দেখাবে না।`
                : "আপনার ব্যাচে নোটিশ পাঠানো হলে এখানে দেখা যাবে।"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}


import { Bell, CalendarDays, Users } from "lucide-react";

import { toggleNoticePublishAction } from "@/app/admin/notices/actions";
import { getAdminClassLabel, getAdminStatusLabel } from "@/constants/admin-display";
import { formatAdminDate, formatAdminNumber } from "@/lib/admin-format";
import { NoticeDeleteButton } from "./NoticeDeleteButton";
import { NoticeEditDialog, type AdminNoticeItem } from "./NoticeEditDialog";
import type { NoticeBatchOption } from "./NoticeCreateForm";

const typeLabel: Record<string, string> = {
  general: "General",
  class: "Class",
  batch: "Batch",
  exam: "Exam",
  payment: "Payment",
};

function batchMeta(notice: AdminNoticeItem, batches: NoticeBatchOption[]) {
  if (notice.batch && typeof notice.batch !== "string") {
    const noticeBatch = notice.batch;
    const code = noticeBatch.batchCode;
    const title = noticeBatch.title;
    const count = batches.find((batch) => batch._id === String(noticeBatch._id ?? ""))?.studentCount;
    return {
      label: code && title ? `${code} · ${title}` : code || title || "No batch",
      count,
    };
  }
  const batchId = typeof notice.batch === "string" ? notice.batch : "";
  const match = batches.find((batch) => batch._id === batchId);
  return {
    label: match?.batchCode || match?.title || "No batch",
    count: match?.studentCount,
  };
}

export function AdminNoticeList({
  notices,
  batches,
}: {
  notices: AdminNoticeItem[];
  batches: NoticeBatchOption[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-sage-border bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-sage-border bg-sage-red-50/30 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-xl font-bold text-sage-secondary">Sent Notices</h2>
          <p className="mt-1 text-sm text-sage-gray-600">Only students in the selected batch can view published notices.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-sage-primary ring-1 ring-sage-red-100">
          {formatAdminNumber(notices.length)}
        </span>
      </div>

      <div className="divide-y divide-sage-border">
        {notices.length ? (
          notices.map((notice) => {
            const batch = batchMeta(notice, batches);
            return (
              <article key={notice._id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-lg bg-sage-red-50 p-2 text-sage-primary">
                        <Bell className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-sage-secondary">{notice.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-md bg-sage-red-50 px-2 py-1 text-xs font-semibold text-sage-primary">
                            {typeLabel[notice.type] ?? notice.type}
                          </span>
                          <span className="rounded-md bg-sage-red-50 px-2 py-1 text-xs font-semibold text-sage-primary">
                            {notice.classLevel ? getAdminClassLabel(notice.classLevel) : "No class"}
                          </span>
                          <span className="rounded-md bg-sage-red-50 px-2 py-1 text-xs font-semibold text-sage-primary">
                            {batch.label}
                          </span>
                          <span
                            className={`rounded-md px-2 py-1 text-xs font-semibold ${
                              notice.isPublished
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {getAdminStatusLabel(notice.isPublished ? "published" : "draft")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {(notice.topic || notice.details) && (
                      <div className="mt-4 rounded-lg border border-sage-border bg-sage-red-50/20 px-4 py-3">
                        {notice.topic && (
                          <p className="text-sm font-semibold text-sage-secondary">Topic: {notice.topic}</p>
                        )}
                        {notice.details && (
                          <p className="mt-1 text-sm leading-7 text-sage-gray-700">{notice.details}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-sage-gray-500">
                      <p className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        {notice.examDate
                          ? formatAdminDate(notice.examDate)
                          : "Date not set"}
                      </p>
                      {batch.count !== undefined && (
                        <p className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {formatAdminNumber(batch.count)} students can view
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    <form action={toggleNoticePublishAction} className="flex items-center gap-2 rounded-lg border border-sage-border px-3 py-2">
                      <input type="hidden" name="id" value={notice._id} />
                      <label className="flex items-center gap-2 text-sm font-semibold text-sage-secondary">
                        <input
                          name="isPublished"
                          type="checkbox"
                          defaultChecked={notice.isPublished}
                          className="h-4 w-4 accent-sage-primary"
                        />
                        Published
                      </label>
                      <button className="text-sm font-bold text-sage-primary">Save</button>
                    </form>
                    <NoticeEditDialog notice={notice} batches={batches} />
                    <NoticeDeleteButton noticeId={notice._id} title={notice.title} />
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="px-6 py-12 text-center text-sm text-sage-gray-500">No notices yet.</div>
        )}
      </div>
    </section>
  );
}

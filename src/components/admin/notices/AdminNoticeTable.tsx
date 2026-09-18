"use client";

import { useState } from "react";

import { toggleNoticePublishAction } from "@/app/admin/notices/actions";
import { getAdminClassLabel, getAdminStatusLabel } from "@/constants/admin-display";
import { formatAdminDate } from "@/lib/admin-format";
import { NoticeDeleteButton } from "./NoticeDeleteButton";
import { NoticeEditDialog, type AdminNoticeItem } from "./NoticeEditDialog";
import { NoticeViewModal } from "./NoticeViewModal";
import type { NoticeBatchOption } from "./NoticeCreateForm";

const typeLabel: Record<string, string> = {
  general: "General",
  exam: "Exam",
  payment: "Payment",
};

function batchLabel(notice: AdminNoticeItem, batches: NoticeBatchOption[]) {
  if (notice.batch && typeof notice.batch !== "string") {
    return notice.batch.batchCode || notice.batch.title || "—";
  }
  const batchId = typeof notice.batch === "string" ? notice.batch : "";
  const match = batches.find((item) => item._id === batchId);
  return match?.batchCode || match?.title || "—";
}

function formatDate(value?: string) {
  return formatAdminDate(value, "—");
}

export function AdminNoticeTable({
  notices,
  batches,
}: {
  notices: AdminNoticeItem[];
  batches: NoticeBatchOption[];
}) {
  const [viewNotice, setViewNotice] = useState<AdminNoticeItem | null>(null);

  if (!notices.length) {
    return (
      <div className="rounded-xl border border-sage-border bg-sage-white p-8 text-center">
        <h3 className="text-xl font-bold text-sage-secondary">No notices match these filters</h3>
        <p className="mt-2 text-sm text-sage-gray-500">Change the filters or send a new notice.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-sage-border bg-sage-white">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-sage-red-50 text-sage-secondary">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Type</th>
              <th className="p-4">Class</th>
              <th className="p-4">Batch</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border">
            {notices.map((notice) => (
              <tr key={notice._id}>
                <td className="p-4">
                  <button
                    type="button"
                    onClick={() => setViewNotice(notice)}
                    className="line-clamp-2 text-left font-bold text-sage-secondary hover:text-sage-primary"
                  >
                    {notice.title}
                  </button>
                  {notice.topic ? (
                    <p className="mt-1 line-clamp-1 text-xs text-sage-gray-500">Topic: {notice.topic}</p>
                  ) : null}
                </td>
                <td className="p-4">
                  <span className="rounded-full bg-sage-red-50 px-3 py-1 text-xs font-bold text-sage-primary">
                    {typeLabel[notice.type] ?? notice.type}
                  </span>
                </td>
                <td className="p-4 font-semibold text-sage-secondary">
                  {notice.classLevel ? getAdminClassLabel(notice.classLevel) : "—"}
                </td>
                <td className="p-4">
                  <p className="font-semibold text-sage-primary">{batchLabel(notice, batches)}</p>
                </td>
                <td className="p-4 text-sage-gray-700">{formatDate(notice.examDate)}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      notice.isPublished
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {getAdminStatusLabel(notice.isPublished ? "published" : "draft")}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewNotice(notice)}
                      className="rounded-lg bg-sage-red-50 px-3 py-1 text-sm font-bold text-sage-primary hover:bg-sage-primary hover:text-white"
                    >
                      View
                    </button>
                    <form action={toggleNoticePublishAction} className="inline-flex">
                      <input type="hidden" name="id" value={notice._id} />
                      {notice.isPublished ? null : <input type="hidden" name="isPublished" value="on" />}
                      <button
                        type="submit"
                        className="rounded-lg bg-sage-red-50 px-3 py-1 text-sm font-bold text-sage-primary hover:bg-sage-primary hover:text-white"
                      >
                        {notice.isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <NoticeEditDialog notice={notice} batches={batches} compact />
                    <NoticeDeleteButton noticeId={notice._id} title={notice.title} compact />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewNotice ? (
        <NoticeViewModal notice={viewNotice} batches={batches} onClose={() => setViewNotice(null)} />
      ) : null}
    </>
  );
}


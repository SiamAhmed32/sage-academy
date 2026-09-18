"use client";

import { CalendarDays, X } from "lucide-react";

import { getAdminClassLabel, getAdminStatusLabel } from "@/constants/admin-display";
import { formatAdminDate } from "@/lib/admin-format";
import type { AdminNoticeItem } from "./NoticeEditDialog";
import type { NoticeBatchOption } from "./NoticeCreateForm";

const typeLabel: Record<string, string> = {
  general: "General",
  exam: "Exam",
  payment: "Payment",
};

function batchLabel(notice: AdminNoticeItem, batches: NoticeBatchOption[]) {
  if (notice.batch && typeof notice.batch !== "string") {
    const code = notice.batch.batchCode;
    const title = notice.batch.title;
    return code && title ? `${code} · ${title}` : code || title || "—";
  }
  const batchId = typeof notice.batch === "string" ? notice.batch : "";
  const match = batches.find((item) => item._id === batchId);
  return match?.batchCode || match?.title || "—";
}

function formatDate(value?: string) {
  if (!value) return null;
  return formatAdminDate(value, "") || null;
}

export function NoticeViewModal({
  notice,
  batches,
  onClose,
}: {
  notice: AdminNoticeItem;
  batches: NoticeBatchOption[];
  onClose: () => void;
}) {
  const examDate = formatDate(notice.examDate);
  const publishedDate = formatDate(notice.publishedAt);

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-sage-border bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-sage-border bg-sage-red-50/30 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-sage-primary">Notice Details</p>
            <h3 className="mt-1 text-xl font-bold text-sage-secondary">{notice.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-sage-primary ring-1 ring-sage-red-100">
                {typeLabel[notice.type] ?? notice.type}
              </span>
              {notice.classLevel ? (
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-sage-gray-600 ring-1 ring-sage-border">
                  {getAdminClassLabel(notice.classLevel)}
                </span>
              ) : null}
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-sage-gray-600 ring-1 ring-sage-border">
                {batchLabel(notice, batches)}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                  notice.isPublished
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    : "bg-amber-50 text-amber-700 ring-amber-100"
                }`}
              >
                {getAdminStatusLabel(notice.isPublished ? "published" : "draft")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-sage-border p-2 text-sage-secondary hover:bg-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {(examDate || publishedDate) && (
            <div className="flex flex-wrap gap-4 text-sm text-sage-gray-600">
              {examDate ? (
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-sage-primary" />
                  <span>
                    Exam date: <strong className="text-sage-secondary">{examDate}</strong>
                  </span>
                </p>
              ) : null}
              {publishedDate ? (
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-sage-gray-400" />
                  <span>
                    Published: <strong className="text-sage-secondary">{publishedDate}</strong>
                  </span>
                </p>
              ) : null}
            </div>
          )}

          {notice.topic ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-sage-gray-500">Topic</p>
              <p className="mt-1 text-base font-semibold text-sage-secondary">{notice.topic}</p>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-sage-gray-500">Details</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-sage-gray-700">
              {notice.details || "No details provided."}
            </p>
          </div>
        </div>

        <div className="border-t border-sage-border bg-sage-red-50/20 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-sage-primary py-2.5 text-sm font-bold text-white hover:bg-sage-primary-hover sm:w-auto sm:px-8"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


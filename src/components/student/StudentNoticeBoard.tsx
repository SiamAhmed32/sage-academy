"use client";

import { CalendarDays, Eye, X } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";

const noticeTypeLabel: Record<string, string> = {
  general: "সাধারণ",
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

type StudentNoticeBoardProps = {
  notices: NoticeItem[];
  studentBatchCode?: string;
};

const inputClass =
  "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none focus:border-sage-primary";

function noticeDate(notice: NoticeItem) {
  return notice.examDate || notice.publishedAt;
}

function formatNoticeDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });
}

function StudentNoticeViewModal({ notice, onClose }: { notice: NoticeItem; onClose: () => void }) {
  const dateLabel = formatNoticeDate(noticeDate(notice));

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
        <div className="flex items-start justify-between gap-4 border-b border-sage-border bg-sage-red-50/30 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-sage-primary">নোটিশ বিস্তারিত</p>
            <h3 className="mt-1 text-xl font-bold text-sage-secondary">{notice.title}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {notice.type ? (
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-sage-primary ring-1 ring-sage-red-100">
                  {noticeTypeLabel[notice.type] ?? notice.type}
                </span>
              ) : null}
              {dateLabel !== "—" ? (
                <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-sage-gray-600 ring-1 ring-sage-border">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dateLabel}
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-sage-border p-2 text-sage-secondary hover:bg-white"
            aria-label="বন্ধ করুন"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {notice.topic ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-sage-gray-500">বিষয়</p>
              <p className="mt-1 text-base font-semibold text-sage-secondary">{notice.topic}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-sage-gray-500">বিস্তারিত</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-sage-gray-700">
              {notice.details || "কোনো বিস্তারিত লেখা নেই।"}
            </p>
          </div>
        </div>

        <div className="border-t border-sage-border bg-sage-red-50/20 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-sage-primary py-2.5 text-sm font-bold text-white hover:bg-sage-primary-hover sm:w-auto sm:px-8"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentNoticeBoard({ notices, studentBatchCode }: StudentNoticeBoardProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewNotice, setViewNotice] = useState<NoticeItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notices.filter((notice) => {
      if (typeFilter !== "all" && notice.type !== typeFilter) return false;
      if (!q) return true;
      const haystack = [notice.title, notice.topic, notice.details].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [notices, query, typeFilter]);

  function updateType(event: ChangeEvent<HTMLSelectElement>) {
    setTypeFilter(event.target.value);
  }

  return (
    <div>
      <div className="mb-5 grid gap-3 rounded-xl border border-sage-border bg-sage-white p-4 lg:grid-cols-12">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="শিরোনাম, বিষয় বা বিস্তারিত দিয়ে খুঁজুন"
          className={`${inputClass} lg:col-span-8`}
        />
        <select value={typeFilter} onChange={updateType} className={`${inputClass} lg:col-span-3`}>
          <option value="all">সব ধরন</option>
          <option value="exam">পরীক্ষা</option>
          <option value="general">সাধারণ</option>
          <option value="payment">পেমেন্ট</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setTypeFilter("all");
          }}
          className="flex h-10 items-center justify-center rounded-lg border border-sage-border px-4 text-sm font-bold text-sage-secondary lg:col-span-1"
        >
          Reset
        </button>
      </div>

      {filtered.length ? (
        <div className="overflow-hidden rounded-xl border border-sage-border bg-sage-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-sage-red-50 text-sage-secondary">
              <tr>
                <th className="p-4">শিরোনাম</th>
                <th className="p-4">ধরন</th>
                <th className="p-4">তারিখ</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-border">
              {filtered.map((notice) => (
                <tr key={notice._id}>
                  <td className="p-4">
                    <p className="line-clamp-2 font-bold text-sage-secondary">{notice.title}</p>
                    {notice.topic ? (
                      <p className="mt-1 line-clamp-1 text-xs text-sage-gray-500">বিষয়: {notice.topic}</p>
                    ) : null}
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-sage-red-50 px-3 py-1 text-xs font-bold text-sage-primary">
                      {notice.type ? noticeTypeLabel[notice.type] ?? notice.type : "—"}
                    </span>
                  </td>
                  <td className="p-4 text-sage-gray-700">{formatNoticeDate(noticeDate(notice))}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => setViewNotice(notice)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sage-red-50 px-3 py-1 text-sm font-bold text-sage-primary hover:bg-sage-primary hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                      দেখুন
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-sage-border bg-sage-white p-8 text-center">
          <h3 className="text-xl font-bold text-sage-secondary">কোনো নোটিশ নেই</h3>
          <p className="mt-2 text-sm text-sage-gray-500">
            {studentBatchCode
              ? `আপনার ব্যাচ ${studentBatchCode}-এর জন্য পাঠানো নোটিশ এখানে দেখা যাবে।`
              : "আপনার ব্যাচে নোটিশ পাঠানো হলে এখানে দেখা যাবে।"}
          </p>
        </div>
      )}

      {viewNotice ? <StudentNoticeViewModal notice={viewNotice} onClose={() => setViewNotice(null)} /> : null}
    </div>
  );
}


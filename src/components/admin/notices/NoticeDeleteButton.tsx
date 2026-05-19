"use client";

import { Trash2 } from "lucide-react";

import { deleteNoticeAction } from "@/app/admin/notices/actions";

export function NoticeDeleteButton({
  noticeId,
  title,
  compact,
}: {
  noticeId: string;
  title: string;
  compact?: boolean;
}) {
  return (
    <form
      action={deleteNoticeAction}
      onSubmit={(event) => {
        if (!confirm(`"${title}" নোটিশটি মুছে ফেলবেন?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={noticeId} />
      <button
        type="submit"
        className={
          compact
            ? "inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-1 text-sm font-bold text-red-700 hover:bg-red-600 hover:text-white"
            : "inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
        }
        aria-label="মুছুন"
      >
        <Trash2 className="h-4 w-4" />
        {compact ? null : "মুছুন"}
      </button>
    </form>
  );
}

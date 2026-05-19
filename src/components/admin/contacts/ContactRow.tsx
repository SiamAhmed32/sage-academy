"use client";

import { Eye, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";

type ContactRowProps = {
  item: any;
  onView: (item: any) => void;
  onDelete: (item: any) => void;
};

export function ContactRow({ item, onView, onDelete }: ContactRowProps) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <tr className="group border-b border-sage-border transition hover:bg-sage-red-50/30">
      <td className="px-4 py-4">
        <p className="font-bold text-sage-secondary">{item.name}</p>
        <p className="text-xs text-sage-gray-500">{item.phone}</p>
      </td>
      <td className="px-4 py-4 text-sm text-sage-gray-700">
        <span className="line-clamp-1 max-w-[200px]">{item.message}</span>
      </td>
      <td className="px-4 py-4 text-sm text-sage-gray-500">
        {formattedDate}
      </td>
      <td className="px-4 py-4">
        <StatusBadge value={item.status} />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary transition hover:bg-sage-primary hover:text-white"
            title="বিস্তারিত দেখুন"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
            title="মুছে ফেলুন"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

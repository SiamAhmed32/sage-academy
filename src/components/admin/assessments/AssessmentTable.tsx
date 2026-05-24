"use client";

import { AssessmentTableRow } from "./AssessmentTableRow";
import type { AdminAssessmentItem } from "./AssessmentManager";

type Props = {
  items: AdminAssessmentItem[];
  isExam: boolean;
  onEdit: (item: AdminAssessmentItem) => void;
  onArchive: (item: AdminAssessmentItem) => void;
  onRemove: (item: AdminAssessmentItem) => void;
};

export function AssessmentTable({ items, isExam, onEdit, onArchive, onRemove }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-sage-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1060px] text-left text-sm">
          <thead className="bg-sage-red-50/70 text-sage-primary">
            <tr>
              <th className="p-4">শিরোনাম</th>
              <th className="p-4">শ্রেণি / ভার্সন</th>
              <th className="p-4">বিষয়</th>
              <th className="p-4">স্কুল ফোকাস</th>
              <th className="p-4">তারিখ</th>
              <th className="p-4">স্ট্যাটাস</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border">
            {items.map((item) => (
              <AssessmentTableRow
                key={item._id}
                item={item}
                isExam={isExam}
                onEdit={onEdit}
                onArchive={onArchive}
                onRemove={onRemove}
              />
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center font-bold text-sage-gray-500">
                  কোনো আইটেম পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

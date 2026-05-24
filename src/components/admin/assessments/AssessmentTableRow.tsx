"use client";

import { Archive, Edit3, Trash2 } from "lucide-react";

import { toBanglaDigits } from "@/constants/class-levels";
import type { AdminAssessmentItem } from "./AssessmentManager";

type Props = {
  item: AdminAssessmentItem;
  isExam: boolean;
  onEdit: (item: AdminAssessmentItem) => void;
  onArchive: (item: AdminAssessmentItem) => void;
  onRemove: (item: AdminAssessmentItem) => void;
};

function versionLabel(version: string) {
  if (version === "bangla") return "বাংলা";
  if (version === "english") return "English";
  return "Bangla + English";
}

function statusTone(status: string) {
  if (status === "published") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "archived") return "bg-slate-100 text-slate-600 ring-slate-200";
  if (status === "hidden") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-sage-red-50 text-sage-primary ring-sage-red-100";
}

export function AssessmentTableRow({ item, isExam, onEdit, onArchive, onRemove }: Props) {
  return (
    <tr className="align-top hover:bg-sage-red-50/20 transition-colors">
      <td className="p-4">
        <p className="text-base font-black text-sage-secondary">{item.title}</p>
        <p className="mt-1 text-xs text-sage-gray-500">{item.slug}</p>
        {item.image ? <p className="mt-1 text-xs font-bold text-emerald-700">Image added</p> : null}
        {isExam && item.examType ? <p className="mt-1 text-xs font-bold text-sage-primary">{item.examType}</p> : null}
      </td>
      <td className="p-4">
        <p className="font-bold text-sage-secondary">ক্লাস {item.classLevels.map(toBanglaDigits).join(", ")}</p>
        <p className="mt-1 text-xs text-sage-gray-500">{versionLabel(item.version)}</p>
      </td>
      <td className="max-w-[220px] p-4">
        <div className="flex flex-wrap gap-1.5">
          {(() => { const subjects = [...new Set((item.classSpecificInfo || []).flatMap(c => c.subjects))]; return (<>
            {subjects.slice(0, 5).map((subject: string) => (
              <span key={subject} className="rounded-full bg-sage-red-50 px-2 py-1 text-xs font-bold text-sage-secondary ring-1 ring-sage-red-100">{subject}</span>
            ))}
            {subjects.length > 5 && <span className="rounded-full bg-sage-red-50 px-2 py-1 text-xs font-bold text-sage-gray-500">+{subjects.length - 5}</span>}
          </>); })()}
        </div>
      </td>
      <td className="max-w-[240px] p-4 text-xs font-semibold leading-6 text-sage-gray-700">
        {item.schoolFocus.length ? item.schoolFocus.join(", ") : "সব স্কুল"}
      </td>
      <td className="p-4 text-xs font-bold text-sage-gray-600">
        {new Date(item.startDate).toLocaleDateString("bn-BD")} - {new Date(item.endDate).toLocaleDateString("bn-BD")}
      </td>
      <td className="p-4">
        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusTone(item.status)}`}>{item.status}</span>
        {item.featured ? <p className="mt-2 text-xs font-bold text-sage-primary">Featured</p> : null}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onEdit(item)} className="grid h-9 w-9 place-items-center rounded-lg border border-sage-border text-sage-secondary hover:border-sage-primary hover:text-sage-primary transition">
            <Edit3 className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onArchive(item)} className="grid h-9 w-9 place-items-center rounded-lg bg-sage-red-50 text-sage-primary hover:bg-sage-primary hover:text-white transition">
            <Archive className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onRemove(item)} className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

"use client";

import { Calendar, Pencil } from "lucide-react";

import { BatchDeleteDialog } from "./BatchDeleteDialog";
import { BatchPermanentDeleteButton } from "./BatchPermanentDeleteButton";
import { BatchRestoreButton } from "./BatchRestoreButton";
import { getClassLabel, toBanglaDigits } from "@/constants/class-levels";
import { getBatchAudienceLabel } from "@/lib/batch-code";
import type { AdminBatch } from "./types";

interface BatchTableRowProps {
  batch: AdminBatch;
  id: string;
  onEdit: () => void;
  onRoutine: () => void;
}

export function BatchTableRow({ batch, id, onEdit, onRoutine }: BatchTableRowProps) {
  return (
    <tr>
      <td className="p-4">
        <p className="line-clamp-1 font-bold text-sage-secondary">{batch.title}</p>
        <p className="mt-1 text-xs font-semibold text-sage-primary">{batch.batchCode}</p>
      </td>
      <td className="p-4">
        <p className="font-semibold text-sage-secondary">
          {batch.classLevel ? getClassLabel(batch.classLevel) : "-"}
        </p>
        <p className="text-xs text-sage-gray-500">
          {getBatchAudienceLabel(batch.genderGroup || "male", batch.version || "bangla")}
        </p>
      </td>
      <td className="p-4 text-sage-gray-700">
        <span className="line-clamp-2">
          {batch.subjects?.length ? `${toBanglaDigits(batch.subjects.length)} subjects` : "০ subjects"}
        </span>
      </td>
      <td className="p-4 font-bold text-sage-gray-700">
        {toBanglaDigits(batch.totalSeats || 0)} /{" "}
        <span className="text-sage-primary">{toBanglaDigits(batch.availableSeats || 0)}</span>
      </td>
      <td className="max-w-60 p-4 text-sage-gray-700">
        <span className="line-clamp-2">{batch.routineNote || "-"}</span>
      </td>
      <td className="p-4">
        <span className="rounded-full bg-sage-red-50 px-3 py-1 text-xs font-bold text-sage-primary">
          {batch.isArchived ? "আর্কাইভড" : batch.status}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sage-red-50 px-3 py-1 text-sm font-bold text-sage-primary transition hover:bg-sage-primary hover:text-white"
            title="ব্যাচ তথ্য এডিট"
          >
            <Pencil size={14} /> এডিট
          </button>
          <button
            type="button"
            onClick={onRoutine}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white"
            title="রুটিন সেট করুন"
          >
            <Calendar size={14} /> রুটিন
          </button>
          {batch.isArchived ? (
            <>
              <BatchRestoreButton batchId={id} />
              <BatchPermanentDeleteButton batchId={id} batchTitle={batch.title} />
            </>
          ) : (
            <BatchDeleteDialog batchId={id} batchTitle={batch.title} />
          )}
        </div>
      </td>
    </tr>
  );
}

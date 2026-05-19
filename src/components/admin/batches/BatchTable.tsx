"use client";

import { Fragment, useState } from "react";

import { BatchDeleteDialog } from "@/components/admin/batches/BatchDeleteDialog";
import { BatchEditDialog } from "@/components/admin/batches/BatchEditDialog";
import { BatchPermanentDeleteButton } from "@/components/admin/batches/BatchPermanentDeleteButton";
import { BatchRestoreButton } from "@/components/admin/batches/BatchRestoreButton";
import { getClassLabel, toBanglaDigits } from "@/constants/class-levels";
import { getBatchAudienceLabel } from "@/lib/batch-code";
import type { AdminBatch, TeacherOption } from "./types";

function batchId(batch: AdminBatch) {
  return typeof batch._id === "string" ? batch._id : batch._id.toString();
}

export function BatchTable({
  batches,
  teachers,
}: {
  batches: AdminBatch[];
  teachers: TeacherOption[];
}) {
  const [editingBatchId, setEditingBatchId] = useState("");

  if (!batches.length) {
    return (
      <div className="rounded-xl border border-sage-border bg-sage-white p-8 text-center">
        <h3 className="text-xl font-bold text-sage-secondary">এখনো কোনো ব্যাচ নেই</h3>
        <p className="mt-2 text-sm text-sage-gray-500">প্রথমে একটি ব্যাচ তৈরি করুন, তারপর শিক্ষার্থীদের সেই ব্যাচে যুক্ত করুন।</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-sage-border bg-sage-white">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead className="bg-sage-red-50 text-sage-secondary">
          <tr>
            <th className="p-4">ব্যাচ</th>
            <th className="p-4">ধরন</th>
            <th className="p-4">সাবজেক্ট</th>
            <th className="p-4">সিট (মোট/খালি)</th>
            <th className="p-4">রুটিন নোট</th>
            <th className="p-4">স্ট্যাটাস</th>
            <th className="p-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sage-border">
          {batches.map((batch) => {
            const id = batchId(batch);
            const isEditing = editingBatchId === id;

            return (
              <Fragment key={id}>
                <tr>
                  <td className="p-4">
                    <p className="line-clamp-1 font-bold text-sage-secondary">{batch.title}</p>
                    <p className="mt-1 text-xs font-semibold text-sage-primary">{batch.batchCode}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-sage-secondary">{batch.classLevel ? getClassLabel(batch.classLevel) : "-"}</p>
                    <p className="text-xs text-sage-gray-500">
                      {getBatchAudienceLabel(batch.genderGroup || "male", batch.version || "bangla")}
                    </p>
                  </td>
                  <td className="p-4 text-sage-gray-700">
                    <span className="line-clamp-2">
                      {batch.subjects?.length ? `${toBanglaDigits(batch.subjects.length)} subjects` : "০ subjects"}
                    </span>
                  </td>
                  <td className="p-4 text-sage-gray-700 font-bold">
                    {toBanglaDigits(batch.totalSeats || 0)} / <span className="text-sage-primary">{toBanglaDigits(batch.availableSeats || 0)}</span>
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
                        onClick={() => setEditingBatchId(isEditing ? "" : id)}
                        className={`rounded-lg px-3 py-1 text-sm font-bold transition ${
                          isEditing 
                            ? "bg-sage-secondary text-white" 
                            : "bg-sage-red-50 text-sage-primary hover:bg-sage-primary hover:text-white"
                        }`}
                      >
                        {isEditing ? "বন্ধ" : "এডিট"}
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
                {isEditing ? (
                  <tr>
                    <td colSpan={7} className="bg-sage-white p-4">
                      <BatchEditDialog batch={{ ...batch, _id: id }} teachers={teachers} onCancel={() => setEditingBatchId("")} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

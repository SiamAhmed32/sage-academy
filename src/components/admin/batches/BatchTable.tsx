"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BatchInfoModal } from "./BatchInfoModal";
import { BatchRoutineModal } from "./BatchRoutineModal";
import { BatchTableRow } from "./BatchTableRow";
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
  const [editBatch, setEditBatch] = useState<(AdminBatch & { _id: string }) | null>(null);
  const [routineBatch, setRoutineBatch] = useState<(AdminBatch & { _id: string }) | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const openRoutineId = searchParams?.get("openRoutine");
    if (openRoutineId && batches.length > 0) {
      const match = batches.find((b) => batchId(b) === openRoutineId);
      if (match) {
        setRoutineBatch({ ...match, _id: openRoutineId });
        const params = new URLSearchParams(searchParams.toString());
        params.delete("openRoutine");
        router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
      }
    }
  }, [searchParams, batches, router, pathname]);

  if (!batches.length) {
    return (
      <div className="rounded-xl border border-sage-border bg-sage-white p-8 text-center">
        <h3 className="text-xl font-bold text-sage-secondary">এখনো কোনো ব্যাচ নেই</h3>
        <p className="mt-2 text-sm text-sage-gray-500">
          প্রথমে একটি ব্যাচ তৈরি করুন, তারপর শিক্ষার্থীদের সেই ব্যাচে যুক্ত করুন।
        </p>
      </div>
    );
  }

  return (
    <>
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
              return (
                <BatchTableRow
                  key={id}
                  batch={batch}
                  id={id}
                  onEdit={() => setEditBatch({ ...batch, _id: id })}
                  onRoutine={() => setRoutineBatch({ ...batch, _id: id })}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Info Modal */}
      <BatchInfoModal
        batch={editBatch ?? undefined}
        open={!!editBatch}
        onClose={() => setEditBatch(null)}
      />

      {/* Routine Modal */}
      {routineBatch ? (
        <BatchRoutineModal
          batch={routineBatch}
          teachers={teachers}
          open={!!routineBatch}
          onClose={() => setRoutineBatch(null)}
        />
      ) : null}
    </>
  );
}

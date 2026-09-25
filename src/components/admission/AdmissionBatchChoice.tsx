"use client";

import { useEffect, useState } from "react";

type BatchSubject = { subjectName?: string };
type PublicBatch = {
  _id: string;
  title: string;
  classLevel?: number;
  subjects?: BatchSubject[];
};

type Props = {
  batchId: string;
  subjects: string;
  onBatchChange: (batchId: string, title: string) => void;
  onSubjectsChange: (subjects: string) => void;
};

export function AdmissionBatchChoice({ batchId, subjects, onBatchChange, onSubjectsChange }: Props) {
  const [batches, setBatches] = useState<PublicBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/batches?limit=24", { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { data?: { items?: PublicBatch[] } }) => {
        setBatches(json.data?.items ?? []);
      })
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const selected = batches.find((batch) => batch._id === batchId);
  const available = (selected?.subjects ?? [])
    .map((subject) => subject.subjectName?.trim() || "")
    .filter(Boolean);
  const chosen = new Set(
    subjects
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
  );

  function toggleSubject(name: string) {
    const next = new Set(chosen);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    onSubjectsChange([...next].join(", "));
  }

  return (
    <div className="sm:col-span-2 space-y-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="preferredBatch" className="block text-sm font-bold text-sage-secondary">
          ভর্তিচ্ছু <span className="ml-1 text-[#8b1a1a]">*</span>
        </label>
        <select
          id="preferredBatch"
          required
          value={batchId}
          onChange={(event) => {
            const next = batches.find((batch) => batch._id === event.target.value);
            onBatchChange(event.target.value, next?.title ?? "");
            onSubjectsChange("");
          }}
          className="h-12 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white px-4 text-sm text-sage-secondary outline-none transition hover:border-gray-300 focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/10"
        >
          <option value="">{loading ? "ব্যাচ লোড হচ্ছে..." : "ব্যাচ নির্বাচন করুন"}</option>
          {batches.map((batch) => (
            <option key={batch._id} value={batch._id}>
              {batch.title}
              {batch.classLevel ? ` · শ্রেণি ${batch.classLevel}` : ""}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="rounded-lg border border-sage-red-100 bg-[#fffafa] p-4">
          <p className="text-sm font-bold text-sage-secondary">এই ব্যাচে যে বিষয়গুলো আছে</p>
          {available.length === 0 ? (
            <p className="mt-2 text-sm text-sage-gray-700">এই ব্যাচে এখন কোনো বিষয় যোগ করা নেই।</p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {available.map((name) => (
                <label key={name} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-sage-secondary">
                  <input
                    type="checkbox"
                    checked={chosen.has(name)}
                    onChange={() => toggleSubject(name)}
                    className="h-4 w-4 accent-[#8b1a1a]"
                  />
                  {name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

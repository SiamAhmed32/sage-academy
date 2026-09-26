"use client";

import { useEffect, useState } from "react";

type PublicClass = { level: number; name: string; subjects: string[] };

type Props = {
  /** Class level as text ("6"), the value the admin panel reads. */
  classLevel: string;
  subjects: string;
  onClassChange: (classLevel: string) => void;
  onSubjectsChange: (subjects: string) => void;
};

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bn = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
const BN_ORDINAL: Record<number, string> = {
  1: "১ম", 2: "২য়", 3: "৩য়", 4: "৪র্থ", 5: "৫ম", 6: "৬ষ্ঠ", 7: "৭ম", 8: "৮ম", 9: "৯ম", 10: "১০ম", 11: "একাদশ", 12: "দ্বাদশ",
};
const classLabel = (level: number) => `${BN_ORDINAL[level] ?? bn(level)} শ্রেণি`;

/**
 * Class + subjects of interest for the website admission form. The parent
 * does not pick a batch — SAGE assigns the batch when admitting the student.
 */
export function AdmissionClassChoice({ classLevel, subjects, onClassChange, onSubjectsChange }: Props) {
  const [classes, setClasses] = useState<PublicClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/site/admission-classes", { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { data?: { items?: PublicClass[] } }) => setClasses(json.data?.items ?? []))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const selected = classes.find((item) => String(item.level) === classLevel);
  const chosen = new Set(subjects.split(",").map((s) => s.trim()).filter(Boolean));

  function toggleSubject(name: string) {
    const next = new Set(chosen);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    onSubjectsChange([...next].join(", "));
  }

  return (
    <div className="sm:col-span-2 space-y-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="className" className="block text-sm font-bold text-sage-secondary">
          ভর্তিচ্ছু শ্রেণি <span className="ml-1 text-[#8b1a1a]">*</span>
        </label>
        <select
          id="className"
          required
          value={classLevel}
          onChange={(event) => {
            onClassChange(event.target.value);
            onSubjectsChange("");
          }}
          className="h-12 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 text-sm text-sage-secondary outline-none transition hover:border-gray-300 focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/10"
        >
          <option value="">{loading ? "শ্রেণি লোড হচ্ছে..." : classes.length ? "শ্রেণি নির্বাচন করুন" : "এখন ভর্তি চলছে না"}</option>
          {classes.map((item) => (
            <option key={item.level} value={String(item.level)}>
              {classLabel(item.level)}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <div className="rounded-lg border border-sage-red-100 bg-[#fffafa] p-4">
          <p className="text-sm font-bold text-sage-secondary">যে বিষয়গুলো পড়তে চান সেগুলো বেছে নিন</p>
          {selected.subjects.length === 0 ? (
            <p className="mt-2 text-sm text-sage-gray-700">এই শ্রেণির বিষয় এখনো যোগ করা হয়নি। আমরা আপনার সাথে যোগাযোগ করব।</p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {selected.subjects.map((name) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-sage-secondary"
                >
                  <input type="checkbox" checked={chosen.has(name)} onChange={() => toggleSubject(name)} className="h-4 w-4 accent-[#8b1a1a]" />
                  {name}
                </label>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-sage-gray-500">ব্যাচ আমরা আপনার সাথে কথা বলে ঠিক করে দেব।</p>
        </div>
      ) : null}
    </div>
  );
}

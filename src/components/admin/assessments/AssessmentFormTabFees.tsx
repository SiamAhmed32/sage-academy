"use client";

import { classLevelOptions, getClassLabel } from "@/constants/class-levels";

type FeeRow = {
  classLevel: number;
  label: string;
  sageStudentFee: number;
  outsideStudentFee: number;
};

type Props = {
  classLevels: number[];
  fees: FeeRow[];
  onChange: (classLevels: number[], fees: FeeRow[]) => void;
};

const inputClass = "h-11 rounded-xl border border-sage-border bg-white px-3 text-sm outline-none focus:border-sage-primary w-full";

export function AssessmentFormTabFees({ classLevels, fees, onChange }: Props) {
  function syncFeesForClasses(currentFees: FeeRow[], levels: number[]) {
    return levels.map((level) => {
      const existing = currentFees.find((fee) => Number(fee.classLevel) === level);
      return existing || {
        classLevel: level,
        label: getClassLabel(level),
        sageStudentFee: 0,
        outsideStudentFee: 0,
      };
    });
  }

  function toggleClass(level: number) {
    const exists = classLevels.includes(level);
    const nextLevels = exists
      ? classLevels.filter((item) => item !== level)
      : [...classLevels, level].sort((a, b) => a - b);
    const nextFees = syncFeesForClasses(fees, nextLevels);
    onChange(nextLevels, nextFees);
  }

  function updateFee(index: number, field: "sageStudentFee" | "outsideStudentFee", value: number) {
    const next = [...fees];
    next[index] = { ...next[index], [field]: value };
    onChange(classLevels, next);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-sage-border bg-sage-red-50/20 p-4">
        <p className="text-sm font-black text-sage-secondary">শ্রেণি নির্বাচন</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {classLevelOptions.filter((item) => item.value >= 4 && item.value <= 12).map((option) => {
            const isActive = classLevels.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleClass(option.value)}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                  isActive ? "bg-sage-primary text-white" : "bg-white text-sage-secondary ring-1 ring-sage-border hover:bg-sage-red-50/30"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-sage-border bg-white p-4">
        <p className="text-sm font-black text-sage-secondary">শ্রেণি অনুযায়ী ফি</p>
        {fees.length === 0 ? (
          <p className="mt-3 text-center py-4 text-sm text-sage-gray-400">কোনো শ্রেণি নির্বাচিত নেই। অনুগ্রহ করে প্রথমে শ্রেণি নির্বাচন করুন।</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead className="text-left text-sage-primary">
                <tr>
                  <th className="py-2">শ্রেণি</th>
                  <th className="py-2 pr-3">SAGE শিক্ষার্থী ফি</th>
                  <th className="py-2">বাইরের শিক্ষার্থী ফি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-border">
                {fees.map((fee, index) => (
                  <tr key={fee.classLevel}>
                    <td className="py-3 font-black text-sage-secondary">{getClassLabel(fee.classLevel)}</td>
                    <td className="py-3 pr-3">
                      <input
                        type="number"
                        min="0"
                        value={fee.sageStudentFee}
                        onChange={(e) => updateFee(index, "sageStudentFee", Number(e.target.value || 0))}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="number"
                        min="0"
                        value={fee.outsideStudentFee}
                        onChange={(e) => updateFee(index, "outsideStudentFee", Number(e.target.value || 0))}
                        className={inputClass}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { toBanglaDigits } from "@/constants/class-levels";
import type { StudentOption } from "./PaymentManager";

type Props = {
  selectedStudent: StudentOption | null;
  onSelect: (student: StudentOption) => void;
};

type ApiResponse = { success: boolean; data?: StudentOption[] };

const classOptions = Array.from({ length: 12 }, (_, index) => index + 1);

export function PaymentStudentPicker({ selectedStudent, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const canSearch = query.trim().length > 0 || classLevel;

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (!canSearch) {
        setStudents([]);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (classLevel) params.set("classLevel", classLevel);
        const res = await fetch(`/api/admin/payment-students?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as ApiResponse;
        setStudents(json.success ? json.data || [] : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setStudents([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, classLevel, canSearch]);

  return (
    <div className="grid gap-3 text-sm font-bold text-sage-secondary">
      <span>শিক্ষার্থী নির্বাচন *</span>
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-sage-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="নাম, আইডি বা ফোন দিয়ে খুঁজুন..."
            className="h-12 w-full rounded-xl border border-sage-border pl-10 pr-4 outline-none focus:border-sage-primary"
          />
        </div>
        <select
          value={classLevel}
          onChange={(event) => setClassLevel(event.target.value)}
          className="h-12 rounded-xl border border-sage-border bg-white px-4 outline-none focus:border-sage-primary"
        >
          <option value="">সব ক্লাস</option>
          {classOptions.map((level) => (
            <option key={level} value={level}>ক্লাস {toBanglaDigits(level)}</option>
          ))}
        </select>
      </div>

      {selectedStudent && (
        <div className="rounded-xl border border-sage-primary/30 bg-sage-red-50/40 px-3 py-2 text-sm text-sage-secondary">
          নির্বাচিত: {selectedStudent.nameEnglish} · আইডি: {selectedStudent.studentId}
        </div>
      )}

      <div className="max-h-56 overflow-y-auto rounded-xl border border-sage-border bg-white">
        {students.map((student) => (
          <button
            type="button"
            key={student._id}
            onClick={() => onSelect(student)}
            className="flex w-full items-center justify-between gap-3 border-b border-sage-border/60 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-sage-red-50/50"
          >
            <span>
              <span className="block font-bold text-sage-secondary">{student.nameEnglish}</span>
              <span className="text-sm text-sage-gray-500">
                আইডি: {student.studentId}{student.classLevel ? ` · ক্লাস ${toBanglaDigits(student.classLevel)}` : ""}
              </span>
            </span>
            <span className="rounded-full bg-sage-red-50 px-3 py-1 text-sm text-sage-primary">
              {toBanglaDigits(student.selectedSubjects.length)} বিষয়
            </span>
          </button>
        ))}
        {!students.length && (
          <p className="px-3 py-4 text-center text-sm text-sage-gray-500">
            {isLoading ? "খোঁজা হচ্ছে..." : canSearch ? "কোনো শিক্ষার্থী পাওয়া যায়নি" : "নাম, আইডি, ফোন বা ক্লাস দিয়ে খুঁজুন"}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { getAdminClassLabel } from "@/constants/admin-display";
import { formatAdminNumber } from "@/lib/admin-format";
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
      <span>Select Student *</span>
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-sage-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, ID, or phone..."
            className="h-12 w-full rounded-xl border border-sage-border pl-10 pr-4 outline-none focus:border-sage-primary"
          />
        </div>
        <select
          value={classLevel}
          onChange={(event) => setClassLevel(event.target.value)}
          className="h-12 rounded-xl border border-sage-border bg-white px-4 outline-none focus:border-sage-primary"
        >
          <option value="">All Classes</option>
          {classOptions.map((level) => (
            <option key={level} value={level}>{getAdminClassLabel(level)}</option>
          ))}
        </select>
      </div>

      {selectedStudent && (
        <div className="rounded-xl border border-sage-primary/30 bg-sage-red-50/40 px-3 py-2 text-sm text-sage-secondary">
          Selected: {selectedStudent.nameEnglish} · ID: {selectedStudent.studentId}
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
                ID: {student.studentId}{student.classLevel ? ` · ${getAdminClassLabel(student.classLevel)}` : ""}
              </span>
            </span>
            <span className="rounded-full bg-sage-red-50 px-3 py-1 text-sm text-sage-primary">
              {formatAdminNumber(student.selectedSubjects.length)} subjects
            </span>
          </button>
        ))}
        {!students.length && (
          <p className="px-3 py-4 text-center text-sm text-sage-gray-500">
            {isLoading ? "Searching..." : canSearch ? "No students found" : "Search by name, ID, phone, or class"}
          </p>
        )}
      </div>
    </div>
  );
}

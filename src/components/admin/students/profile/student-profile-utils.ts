import { buildWeeklyRoutineFromBatch } from "@/lib/routine-utils";
import { formatAdminCurrency, formatAdminNumber } from "@/lib/admin-format";

import type { RoutineItem, StudentFeeSubject, StudentProfile } from "./types";

export function subjectTotal(subjects: StudentFeeSubject[] = []) {
  return subjects.reduce((sum, subject) => sum + (subject.monthlyFee || 0), 0);
}

export function discountText(subject: StudentFeeSubject) {
  const baseFee = subject.baseFee ?? subject.monthlyFee;
  if (baseFee <= subject.monthlyFee) return "No discount";
  if (subject.discountType === "percent" && subject.discountValue) {
    return `${formatAdminNumber(subject.discountValue)}% discount`;
  }
  return `${formatAdminCurrency(baseFee - subject.monthlyFee)} discount`;
}

export function buildRoutine(student: StudentProfile): RoutineItem[] {
  return buildWeeklyRoutineFromBatch(student.batch?.subjects, (subject, day) => ({
    day: day.en,
    dayBn: day.en,
    subjectName: subject.subjectName ?? "Subject",
    teacherName: subject.teacher?.name ?? "Teacher not assigned",
    startTime: subject.startTime ?? "",
    endTime: subject.endTime ?? "",
  }));
}

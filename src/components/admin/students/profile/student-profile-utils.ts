import { buildWeeklyRoutineFromBatch } from "@/lib/routine-utils";

import type { RoutineItem, StudentFeeSubject, StudentProfile } from "./types";

export function subjectTotal(subjects: StudentFeeSubject[] = []) {
  return subjects.reduce((sum, subject) => sum + (subject.monthlyFee || 0), 0);
}

export function discountText(subject: StudentFeeSubject) {
  const baseFee = subject.baseFee ?? subject.monthlyFee;
  if (baseFee <= subject.monthlyFee) return "কোনো ছাড় নেই";
  if (subject.discountType === "percent" && subject.discountValue) {
    return `${subject.discountValue}% ছাড়`;
  }
  return `৳${baseFee - subject.monthlyFee} ছাড়`;
}

export function buildRoutine(student: StudentProfile): RoutineItem[] {
  return buildWeeklyRoutineFromBatch(student.batch?.subjects, (subject, day) => ({
    day: day.en,
    dayBn: day.bn,
    subjectName: subject.subjectName ?? "বিষয়",
    teacherName: subject.teacher?.name ?? "শিক্ষক নির্ধারণ হয়নি",
    startTime: subject.startTime ?? "",
    endTime: subject.endTime ?? "",
  }));
}

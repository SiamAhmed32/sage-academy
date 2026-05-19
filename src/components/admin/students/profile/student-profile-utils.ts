import type { RoutineItem, StudentFeeSubject, StudentProfile } from "./types";

export const routineDays = [
  ["Saturday", "শনিবার"],
  ["Sunday", "রবিবার"],
  ["Monday", "সোমবার"],
  ["Tuesday", "মঙ্গলবার"],
  ["Wednesday", "বুধবার"],
  ["Thursday", "বৃহস্পতিবার"],
  ["Friday", "শুক্রবার"],
] as const;

function timeValue(time: string) {
  const parsed = Date.parse(`January 1, 2000 ${time}`);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

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
  const names = new Set(
    (student.selectedSubjects ?? []).map((s) => s.subjectName.trim().toLowerCase())
  );

  return routineDays.flatMap(([day, dayBn]) =>
    (student.batch?.subjects ?? [])
      .filter((subject) => {
        const subjectDays = subject.days ?? [];
        const enrolled = names.has(subject.subjectName.trim().toLowerCase());
        return enrolled && (subjectDays.includes(day) || subjectDays.includes(dayBn));
      })
      .map((subject) => ({
        day,
        dayBn,
        subjectName: subject.subjectName,
        teacherName: subject.teacher?.name ?? "শিক্ষক নির্ধারণ হয়নি",
        startTime: subject.startTime ?? "",
        endTime: subject.endTime ?? "",
      }))
  ).sort((a, b) => {
    const dayA = routineDays.findIndex(([day]) => day === a.day);
    const dayB = routineDays.findIndex(([day]) => day === b.day);
    return dayA - dayB || timeValue(a.startTime) - timeValue(b.startTime);
  });
}

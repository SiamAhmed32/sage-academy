export type RoutineSubject = {
  subjectName?: string;
  teacher?: { name?: string } | null;
  days?: string[];
  startTime?: string;
  endTime?: string;
};

export type RoutineDayPair = {
  en: string;
  bn: string;
};

export const routineDayPairs: RoutineDayPair[] = [
  { en: "Saturday", bn: "শনিবার" },
  { en: "Sunday", bn: "রবিবার" },
  { en: "Monday", bn: "সোমবার" },
  { en: "Tuesday", bn: "মঙ্গলবার" },
  { en: "Wednesday", bn: "বুধবার" },
  { en: "Thursday", bn: "বৃহস্পতিবার" },
  { en: "Friday", bn: "শুক্রবার" },
];

export function timeValue(time: string) {
  const parsed = Date.parse(`January 1, 2000 ${time}`);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

export function subjectOnDay(subject: RoutineSubject, day: RoutineDayPair) {
  const days = subject.days ?? [];
  return days.includes(day.en) || days.includes(day.bn);
}

export function isConfiguredRoutineSlot(subject: RoutineSubject) {
  const name = String(subject.subjectName ?? "").trim();
  const startTime = String(subject.startTime ?? "").trim();
  const endTime = String(subject.endTime ?? "").trim();
  return Boolean(name && startTime && endTime && (subject.days?.length ?? 0) > 0);
}

/** Weekly class list from batch subjects (full batch routine when batch is assigned). */
export function buildWeeklyRoutineFromBatch<T extends RoutineSubject>(
  batchSubjects: T[] | undefined,
  mapItem: (subject: T, day: RoutineDayPair) => {
    day: string;
    dayBn: string;
    subjectName: string;
    teacherName: string;
    startTime: string;
    endTime: string;
  }
) {
  const subjects = batchSubjects ?? [];

  return routineDayPairs
    .flatMap((day) =>
      subjects
        .filter((subject) => isConfiguredRoutineSlot(subject) && subjectOnDay(subject, day))
        .map((subject) => mapItem(subject, day))
    )
    .sort((a, b) => {
      const dayA = routineDayPairs.findIndex((day) => day.en === a.day);
      const dayB = routineDayPairs.findIndex((day) => day.en === b.day);
      return dayA - dayB || timeValue(a.startTime) - timeValue(b.startTime);
    });
}

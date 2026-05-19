import AcademicBatch from "@/models/AcademicBatch";
import { connectDB } from "@/lib/mongodb";

export const ROUTINE_DAYS = [
  "শনিবার",
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
] as const;

export type RoutineDay = (typeof ROUTINE_DAYS)[number];

const JS_DAY_LABELS: RoutineDay[] = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
];

const DAY_VALUE_MAP: Record<RoutineDay, string> = {
  শনিবার: "Saturday",
  রবিবার: "Sunday",
  সোমবার: "Monday",
  মঙ্গলবার: "Tuesday",
  বুধবার: "Wednesday",
  বৃহস্পতিবার: "Thursday",
  শুক্রবার: "Friday",
};

export type RoutineClass = {
  id: string;
  batchTitle: string;
  batchCode: string;
  classLevel: number | null;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  seats: string;
  status: string;
  routineNote: string;
};

type LeanSubject = {
  _id?: { toString(): string };
  subjectName?: string;
  teacher?: { name?: string } | null;
  days?: string[];
  startTime?: string;
  endTime?: string;
};

type LeanBatch = {
  _id: { toString(): string };
  title?: string;
  batchCode?: string;
  classLevel?: number;
  subjects?: LeanSubject[];
  totalSeats?: number;
  availableSeats?: number;
  status?: string;
  routineNote?: string;
};

function timeValue(time: string) {
  const parsed = Date.parse(`January 1, 2000 ${time}`);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

export function getRoutineDay(value?: string): RoutineDay {
  if (value && ROUTINE_DAYS.includes(value as RoutineDay)) return value as RoutineDay;
  return JS_DAY_LABELS[new Date().getDay()];
}

export function getRoutineDayValues(day: RoutineDay) {
  return [day, DAY_VALUE_MAP[day]];
}

export async function getRoutineClasses(day: RoutineDay) {
  await connectDB();
  const dayValues = getRoutineDayValues(day);

  const batches = await AcademicBatch.find({
    isActive: true,
    isArchived: { $ne: true },
    "subjects.days": { $in: dayValues },
  })
    .populate("subjects.teacher", "name")
    .sort({ classLevel: 1, title: 1 })
    .lean<LeanBatch[]>();

  return batches
    .flatMap((batch) =>
      (batch.subjects ?? [])
        .filter((subject) =>
          (subject.days ?? []).some((subjectDay) => dayValues.includes(subjectDay))
        )
        .map((subject) => ({
          id: `${batch._id.toString()}-${subject._id?.toString() ?? subject.subjectName}`,
          batchTitle: batch.title ?? "ব্যাচ",
          batchCode: batch.batchCode ?? "",
          classLevel: batch.classLevel ?? null,
          subjectName: subject.subjectName ?? "বিষয়",
          teacherName: subject.teacher?.name ?? "শিক্ষক নির্ধারণ হয়নি",
          startTime: subject.startTime ?? "",
          endTime: subject.endTime ?? "",
          seats: `${batch.availableSeats ?? 0}/${batch.totalSeats ?? 0}`,
          status: batch.status ?? "",
          routineNote: batch.routineNote ?? "",
        }))
    )
    .sort((a, b) => timeValue(a.startTime) - timeValue(b.startTime));
}

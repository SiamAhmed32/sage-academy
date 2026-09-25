export type AssessmentKind = "exam" | "modelTest";

type FeeRow = { classLevel: number; label: string; sageStudentFee: number; outsideStudentFee: number };
type RoutineRow = { day: string; time: string; subject: string };
type ClassInfo = { classLevel: number; subjects: string[]; routine: RoutineRow[] };

export type AdminAssessmentItem = {
  _id: string;
  title: string;
  slug: string;
  image?: string;
  examType?: string;
  classLevels: number[];
  version: "bangla" | "english" | "both";
  schoolFocus: string[];
  startDate: string;
  endDate: string;
  routineTitle?: string;
  routineSubtitle?: string;
  scheduleNote: string;
  fees: FeeRow[];
  classSpecificInfo: ClassInfo[];
  features: string[];
  status: "draft" | "published" | "hidden" | "archived";
  featured: boolean;
  order: number;
};

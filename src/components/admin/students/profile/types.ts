export type StudentFeeSubject = {
  subjectName: string;
  monthlyFee: number;
  baseFee?: number;
  discountType?: "none" | "amount" | "percent" | "custom";
  discountValue?: number;
  discountNote?: string;
};

export type BatchRoutineSubject = {
  subjectName: string;
  teacher?: { name?: string } | null;
  days?: string[];
  startTime?: string;
  endTime?: string;
};

export type StudentProfileBatch = {
  title?: string;
  batchCode?: string;
  classLevel?: number;
  subjects?: BatchRoutineSubject[];
};

export type StudentProfile = {
  _id: string;
  studentId: string;
  nameEnglish: string;
  nameBangla?: string;
  whatsapp?: string;
  classLevel?: number;
  schoolName?: string;
  section?: string;
  roll?: string;
  admissionDate?: string;
  presentAddress?: string;
  permanentAddress?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  note?: string;
  isActive?: boolean;
  image?: { url?: string };
  batch?: StudentProfileBatch | null;
  selectedSubjects?: StudentFeeSubject[];
  subjectHistory?: StudentSubjectHistory[];
};

export type StudentSubjectHistory = {
  action: "added" | "removed" | "updated";
  subjectName: string;
  baseFee?: number;
  monthlyFee?: number;
  effectiveMonth: string;
  effectiveYear: number;
  note?: string;
  recordedAt?: string;
};

export type RoutineItem = {
  day: string;
  dayBn: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
};

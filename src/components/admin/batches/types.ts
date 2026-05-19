export type TeacherOption = {
  _id: string;
  name: string;
  subject?: string;
  designation?: string;
};

export type BatchSubjectInput = {
  subjectName: string;
  teacher: string | null;
  days: string[];
  startTime: string;
  endTime: string;
  monthlyFee: number;
};

export type AdminBatch = {
  _id: { toString(): string } | string;
  title: string;
  batchCode: string;
  classLevel: number;
  genderGroup: "male" | "female" | "combined";
  version: "bangla" | "english";
  subjects?: BatchSubjectInput[];
  routineNote?: string;
  examSchedule?: string;
  totalSeats?: number;
  availableSeats?: number;
  status: string;
  isActive: boolean;
  isArchived?: boolean;
  archivedAt?: string | Date;
};

export type ClassRow = {
  _id: string;
  name: string;
  orderIndex: number;
  legacyClassLevel: number;
};

export type SubjectRow = {
  _id: string;
  name: string;
  code?: string;
  baseMonthlyFee: number;
  classId?: { _id: string; name: string } | null;
};

export type BatchGroupRow = {
  _id: string;
  name: string;
  gender: string;
  medium: string;
  batchNumber: number;
  classId?: { _id: string; name: string } | null;
};

export type SubjectBatchRow = {
  _id: string;
  monthlyFee: number;
  maxSeats: number;
  subjectId?: { _id: string; name: string; code?: string; baseMonthlyFee?: number } | null;
  teacherId?: { _id: string; name: string } | null;
  batchGroupId?: { _id: string; name: string } | null;
};

export type StudentRow = {
  _id: string;
  nameEnglish: string;
  studentId: string;
};

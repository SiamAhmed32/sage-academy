// Shared, framework-free constants for the academy workflow
// (Class → Subject → Batch → Enrollment → Dues → Receipts).
// Safe to import from both server and client code.

export const WEEK_DAYS = ["sat", "sun", "mon", "tue", "wed", "thu"] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  sat: "Saturday",
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
};

export const WEEK_DAY_SHORT: Record<WeekDay, string> = {
  sat: "Sat",
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
};

export const BATCH_GENDERS = ["boys", "girls"] as const;
export type BatchGender = (typeof BATCH_GENDERS)[number];

export const BATCH_GENDER_LABELS: Record<BatchGender, string> = {
  boys: "Boys",
  girls: "Girls",
};

export const STUDENT_GENDERS = ["male", "female"] as const;
export type StudentGender = (typeof STUDENT_GENDERS)[number];

export const STUDENT_GENDER_LABELS: Record<StudentGender, string> = {
  male: "Male",
  female: "Female",
};

export function batchGenderForStudent(gender: StudentGender): BatchGender {
  return gender === "female" ? "girls" : "boys";
}

export const VERSIONS = ["bangla", "english"] as const;
export type Version = (typeof VERSIONS)[number];

export const VERSION_LABELS: Record<Version, string> = {
  bangla: "Bangla version",
  english: "English version",
};

export const VERSION_SHORT: Record<Version, string> = {
  bangla: "Bangla",
  english: "English",
};

export const DISCOUNT_TYPES = ["none", "percent", "amount"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const PAYMENT_METHODS = ["cash", "bkash", "nagad", "bank"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  bkash: "bKash",
  nagad: "Nagad",
  bank: "Bank transfer",
};

export const DUE_KINDS = ["tuition", "admission", "materials", "exam", "other"] as const;
export type DueKind = (typeof DUE_KINDS)[number];

export const DUE_KIND_LABELS: Record<DueKind, string> = {
  tuition: "Tuition",
  admission: "Admission",
  materials: "Materials",
  exam: "Exam",
  other: "Other",
};

export const DUE_STATUSES = ["unpaid", "partial", "paid", "void"] as const;
export type DueStatus = (typeof DUE_STATUSES)[number];

export const ACADEMY_CONTACT = {
  name: "SAGE Academy",
  address: "House-36 (Lift-3), Road-3, Block-C, Banasree, Rampura, Dhaka",
  phones: ["09617576776", "01629106190"],
  email: "sageacademybd@gmail.com",
};

/** Subject tone (1–5) for timetable cards, stable per subject id. */
export function subjectTone(key: string): 1 | 2 | 3 | 4 | 5 {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return ((hash % 5) + 1) as 1 | 2 | 3 | 4 | 5;
}

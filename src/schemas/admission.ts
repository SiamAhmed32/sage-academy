import { z } from "zod";

import { isValidBdMobileNormalized, normalizeBangladeshPhone } from "@/lib/bd-phone";

const objectId = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const phoneSchema = z
  .string()
  .trim()
  .transform(normalizeBangladeshPhone)
  .refine((val) => isValidBdMobileNormalized(val), {
    message: "সঠিক বাংলাদেশি মোবাইল নম্বর দিন (০১ দিয়ে শুরু, ১১ ডিজিট)।",
  });

const optionalPhoneSchema = z
  .string()
  .trim()
  .transform(normalizeBangladeshPhone)
  .refine((val) => val === "" || isValidBdMobileNormalized(val), {
    message: "সঠিক বাংলাদেশি মোবাইল নম্বর দিন (০১ দিয়ে শুরু, ১১ ডিজিট)।",
  })
  .optional()
  .default("");

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.coerce.date().nullable().optional()
);

/**
 * One-screen admission: create the Student, enroll them into exactly the
 * subject-batch slots picked on screen, and generate their first invoice —
 * all in one submit instead of separate "create student" then "enroll" steps.
 * Field set mirrors the public admission form (admissionRequestBaseSchema)
 * so a walk-in admission captures the same information a website lead would,
 * and that same detail shows up on the printed receipt.
 */
export const admitStudentSchema = z.object({
  name: z.string().trim().min(1, "Student name is required").max(120),
  nameBangla: optionalText(120),
  phone: phoneSchema,
  guardianPhone: phoneSchema,
  studentWhatsapp: optionalPhoneSchema,
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: optionalDate.default(null),
  classId: objectId,
  medium: z.enum(["bangla", "english"]),
  fatherName: optionalText(120),
  motherName: optionalText(120),
  guardianName: optionalText(120),
  schoolName: optionalText(160),
  section: optionalText(40),
  roll: optionalText(40),
  admissionDate: optionalDate.default(null),
  presentAddress: optionalText(500),
  permanentAddress: optionalText(500),
  // Which subject-batch slots the student is taking. Each entry is the slot
  // the admin picked in the UI — if it turned out full by submit time, the
  // enrollment service rolls it over to the next open section automatically.
  subjectBatchIds: z.array(objectId).min(1, "Select at least one subject"),
  discount: z.number().min(0).optional().default(0),
  billingCycle: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "Billing cycle must be YYYY-MM")
    .optional(),
});

export type AdmitStudentInput = z.infer<typeof admitStudentSchema>;

export const transferEnrollmentSchema = z.object({
  newSubjectBatchId: objectId,
});

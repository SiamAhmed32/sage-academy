import { z } from "zod";

const objectId = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

/** Enroll one student into one or more SubjectBatch slots at once. */
export const enrollStudentSchema = z.object({
  studentId: objectId,
  subjectBatchIds: z.array(objectId).min(1, "Select at least one subject"),
});

export const dropEnrollmentSchema = z.object({
  enrollmentId: objectId,
});

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;

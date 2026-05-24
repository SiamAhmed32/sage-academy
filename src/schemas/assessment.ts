import { z } from "zod";

import { bdPhoneSchema } from "@/lib/bd-phone";

export const assessmentVersionOptions = ["bangla", "english", "both"] as const;
export const assessmentStatusOptions = ["draft", "published", "hidden", "archived"] as const;
export const assessmentLeadStatusOptions = ["new", "contacted", "confirmed", "attended", "cancelled", "invalid"] as const;
export const examTypeOptions = ["Half Yearly", "Pre-Test", "Final", "Board Prep", "Regular Exam"] as const;
export const applicantTypeOptions = ["sage", "outside"] as const;

const text = (field: string, max = 160) => z.string().trim().min(1, `${field} is required`).max(max);
const optionalText = (max = 1000) => z.string().trim().max(max).optional().default("");
const textArray = (field: string, maxItems = 12) =>
  z.array(z.string().trim().min(1).max(120)).min(1, `${field} is required`).max(maxItems);

export const assessmentFeeSchema = z.object({
  classLevel: z.number().int().min(4).max(12).optional(),
  label: text("Fee label", 80),
  sageStudentFee: z.number().int().min(0).optional().default(0),
  outsideStudentFee: z.number().int().min(0).optional().default(0),
});

export const assessmentRoutineEntrySchema = z.object({
  day: text("Routine day", 40),
  time: text("Routine time", 40),
  subject: text("Routine subject", 120),
});

export const assessmentClassInfoSchema = z.object({
  classLevel: z.number().int().min(4).max(12),
  subjects: textArray("Subjects", 20),
  routine: z.array(assessmentRoutineEntrySchema).max(80).optional().default([]),
});

const assessmentBaseObject = z.object({
  title: text("Title", 180),
  slug: optionalText(180),
  image: optionalText(500),
  classLevels: z.array(z.number().int().min(4).max(12)).min(1).max(9),
  version: z.enum(assessmentVersionOptions).optional().default("both"),
  schoolFocus: z.array(z.string().trim().min(1).max(140)).max(12).optional().default([]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  routineTitle: optionalText(120),
  routineSubtitle: optionalText(160),
  scheduleNote: optionalText(800),
  fees: z.array(assessmentFeeSchema).max(8).optional().default([]),
  classSpecificInfo: z.array(assessmentClassInfoSchema).max(9).optional().default([]),
  features: textArray("Features", 8),
  status: z.enum(assessmentStatusOptions).optional().default("draft"),
  featured: z.boolean().optional().default(false),
  order: z.number().int().optional().default(0),
});

const dateRangeRefinement = {
  message: "End date must be after start date",
  path: ["endDate"],
};

export const assessmentBaseSchema = assessmentBaseObject.refine((data) => data.endDate >= data.startDate, dateRangeRefinement);

export const createModelTestSchema = assessmentBaseSchema;
export const updateModelTestSchema = assessmentBaseObject
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, dateRangeRefinement);

const examBaseObject = assessmentBaseObject.extend({
  examType: z.enum(examTypeOptions).optional().default("Regular Exam"),
});

export const createExamSchema = examBaseObject.refine((data) => data.endDate >= data.startDate, dateRangeRefinement);
export const updateExamSchema = examBaseObject
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, dateRangeRefinement);

export const assessmentRegistrationSchema = z.object({
  assessmentKind: z.enum(["modelTest", "exam"]),
  assessmentId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid assessment"),
  name: text("Name", 120),
  phone: bdPhoneSchema,
  classLabel: text("Class", 40),
  version: z.enum(assessmentVersionOptions),
  schoolName: optionalText(160),
  selectedSubjects: z.array(z.string().trim().min(1).max(120)).min(1, "Select at least one subject").max(20),
  applicantType: z.enum(applicantTypeOptions),
  message: optionalText(1000),
});

export type CreateModelTestInput = z.infer<typeof createModelTestSchema>;
export type UpdateModelTestInput = z.infer<typeof updateModelTestSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type AssessmentRegistrationInput = z.infer<typeof assessmentRegistrationSchema>;

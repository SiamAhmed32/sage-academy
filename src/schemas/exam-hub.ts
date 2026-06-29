import { z } from "zod";

import { bdPhoneSchema } from "@/lib/bd-phone";
import { subjectSyllabusItemsSchema } from "@/lib/exam-hub-syllabus";

const programBase = {
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().max(180).optional(),
  subtitle: z.string().trim().max(120).optional(),
  image: z.string().trim().max(500).optional(),
  description: z.string().trim().max(4000).optional(),
  deliveryMode: z.enum(["online", "offline"]),
  offlineType: z.enum(["weekly", "monthly"]).nullable().optional(),
  accessType: z.enum(["public", "private"]).default("public"),
  isPaid: z.boolean().default(false),
  feeAmount: z.coerce.number().min(0).default(0),
  classLevels: z.array(z.coerce.number().min(4).max(12)).default([]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  durationMinutes: z.coerce.number().min(1).max(240).default(20),
  totalMarks: z.coerce.number().min(1).max(500).default(25),
  correctMark: z.coerce.number().default(1),
  wrongMark: z.coerce.number().default(0),
  unansweredMark: z.coerce.number().default(0),
  maxAttempts: z.coerce.number().min(1).max(10).default(1),
  instructions: z.string().trim().max(8000).optional(),
  markingRulesNote: z.string().trim().max(2000).optional(),
  venue: z.string().trim().max(300).optional(),
  scheduleNote: z.string().trim().max(2000).optional(),
  examTime: z.string().trim().max(120).optional(),
  subjectSyllabus: z.string().trim().max(8000).optional(),
  subjectSyllabusItems: subjectSyllabusItemsSchema.optional().default([]),
  enrollmentInfo: z.string().trim().max(2000).optional(),
  shuffleQuestions: z.boolean().default(true),
  showLeaderboard: z.boolean().default(true),
  status: z.enum(["draft", "published", "hidden", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  order: z.coerce.number().default(0),
};

const examProgramObjectSchema = z.object(programBase);

type ExamProgramRefineInput = {
  startDate?: Date;
  endDate?: Date;
  deliveryMode?: "online" | "offline";
  offlineType?: "weekly" | "monthly" | null;
};

function applyExamProgramRefinements<T extends z.ZodType>(schema: T) {
  return schema
    .refine((data) => {
      const value = data as ExamProgramRefineInput;
      return !value.startDate || !value.endDate || value.endDate >= value.startDate;
    }, { message: "End date must be after start date" })
    .refine((data) => {
      const value = data as ExamProgramRefineInput;
      return value.deliveryMode !== "offline" || Boolean(value.offlineType);
    }, {
      message: "Offline exams require weekly or monthly type",
    })
    .refine((data) => {
      const value = data as ExamProgramRefineInput;
      return value.deliveryMode !== "online" || !value.offlineType;
    }, {
      message: "Online exams cannot have offline type",
    });
}

export const createExamProgramSchema = applyExamProgramRefinements(examProgramObjectSchema);

/** Zod 4: `.partial()` cannot be applied to schemas that already have refinements. */
export const updateExamProgramSchema = applyExamProgramRefinements(examProgramObjectSchema.partial());

export const createExamQuestionSchema = z.object({
  programId: z.string().min(1),
  questionText: z.string().trim().min(3).max(2000),
  image: z.string().trim().max(2000).optional(),
  options: z.array(z.object({ text: z.string().trim().min(1).max(500) })).min(2).max(6),
  correctIndex: z.coerce.number().min(0),
  explanation: z.string().trim().max(2000).optional(),
  marks: z.coerce.number().min(0).default(1),
  order: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

export const updateExamQuestionSchema = createExamQuestionSchema.partial().omit({ programId: true });

export const offlineEnrollmentSchema = z.object({
  programSlug: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120),
  phone: bdPhoneSchema,
  email: z.string().trim().email("Enter a valid email").max(160),
  classLabel: z.string().trim().min(1).max(40),
  schoolName: z.string().trim().max(160).optional(),
  message: z.string().trim().max(500).optional(),
});

export const onlineEnrollmentSchema = offlineEnrollmentSchema.extend({
  transactionId: z.string().trim().max(40).optional(),
});

export const startAttemptSchema = z.object({
  programSlug: z.string().trim().min(1),
  enrollmentId: z.string().min(1),
  phone: bdPhoneSchema,
});

export const startAttemptBodySchema = startAttemptSchema.omit({ programSlug: true });

export const saveAnswerSchema = z.object({
  phone: bdPhoneSchema,
  questionId: z.string().min(1),
  selectedIndex: z.coerce.number().min(0).max(5).nullable(),
});

export const submitAttemptSchema = z.object({
  phone: bdPhoneSchema,
});

export const verifyEnrollmentSchema = z
  .object({
    status: z.enum(["confirmed", "cancelled"]),
    paymentStatus: z.enum(["verified", "rejected"]).optional(),
    adminNote: z.string().trim().max(2000).optional(),
  })
  .refine(
    (data) => data.paymentStatus !== "rejected" || Boolean(data.adminNote?.trim()),
    { message: "Rejection message is required", path: ["adminNote"] }
  );

export const enrollmentStatusQuerySchema = z.object({
  programSlug: z.string().trim().min(1),
  phone: bdPhoneSchema.optional(),
  enrollmentId: z.string().trim().min(1).optional(),
});

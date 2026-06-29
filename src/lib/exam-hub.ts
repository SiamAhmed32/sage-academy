import { getClassLabel } from "@/constants/class-levels";
import { normalizeBangladeshPhone } from "@/lib/bd-phone";
import { normalizeSubjectSyllabus } from "@/lib/exam-hub-syllabus";
import { Types } from "mongoose";

export function toProgramObjectId(programId: unknown) {
  const id = String(programId);
  return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : programId;
}

/** Matches active questions and legacy rows where isActive was never set. */
export function activeExamQuestionQuery(programId: unknown) {
  return {
    programId: toProgramObjectId(programId),
    isActive: { $ne: false },
  };
}

export function slugifyExamProgram(input: string) {
  const normalized = input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `exam-${Date.now()}`;
}

export function classRangeLabel(levels: number[]) {
  const sorted = [...new Set(levels)].sort((a, b) => a - b);
  if (sorted.length === 0) return "সব শ্রেণি";
  if (sorted.length === 1) return getClassLabel(sorted[0]);
  return `${getClassLabel(sorted[0])} – ${getClassLabel(sorted[sorted.length - 1])}`;
}

export function formatExamDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatExamDateRange(start: Date | string, end: Date | string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (startDate.toDateString() === endDate.toDateString()) {
    return formatExamDateTime(endDate);
  }
  return `${formatExamDateTime(startDate)} – ${formatExamDateTime(endDate)}`;
}

export function isProgramLive(start: Date | string, end: Date | string, now = new Date()) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
}

export function programRequiresPayment(program: { deliveryMode: string; isPaid?: boolean; accessType?: string }) {
  return program.deliveryMode === "online" && (program.isPaid || program.accessType === "private");
}

export function enrollmentCanStartExam(enrollment: {
  status: string;
  paymentStatus: string;
}) {
  if (enrollment.status !== "confirmed") return false;
  if (enrollment.paymentStatus === "rejected") return false;
  if (["pending", "submitted"].includes(enrollment.paymentStatus)) return false;
  return true;
}

export function enrollmentBlocksNewRequest(enrollment: {
  status: string;
  paymentStatus: string;
}) {
  if (enrollment.status === "cancelled") return false;
  if (enrollment.paymentStatus === "rejected") return false;
  return enrollment.status === "pending" || enrollment.status === "confirmed";
}

export function getEnrollmentStatusLabel(enrollment: {
  status: string;
  paymentStatus: string;
}) {
  if (enrollment.status === "cancelled" || enrollment.paymentStatus === "rejected") {
    return "Registration rejected";
  }
  if (enrollment.status === "confirmed" && enrollmentCanStartExam(enrollment)) {
    return "Registration confirmed";
  }
  if (enrollment.status === "pending" || enrollment.paymentStatus === "submitted") {
    return "Awaiting approval";
  }
  return "Registration pending";
}

export function serializeEnrollmentStatus(enrollment: {
  _id: unknown;
  name: string;
  status: string;
  paymentStatus: string;
  adminNote?: string;
}) {
  const canStartExam = enrollmentCanStartExam(enrollment);
  const canRegisterAgain = !enrollmentBlocksNewRequest(enrollment);

  return {
    enrollmentId: String(enrollment._id),
    name: enrollment.name,
    status: enrollment.status,
    paymentStatus: enrollment.paymentStatus,
    adminNote: enrollment.adminNote || "",
    canStartExam,
    canRegisterAgain,
    statusLabel: getEnrollmentStatusLabel(enrollment),
  };
}

export function sanitizePhone(phone: string) {
  return normalizeBangladeshPhone(phone);
}

export function scoreAttempt(
  questions: Array<{ _id: unknown; marks: number; correctIndex: number }>,
  answers: Array<{ questionId: unknown; selectedIndex: number | null }>,
  rules: { correctMark: number; wrongMark: number; unansweredMark: number }
) {
  let score = 0;
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const graded = answers.map((answer) => {
    const question = questions.find((q) => String(q._id) === String(answer.questionId));
    if (!question) {
      return { ...answer, isCorrect: false, marksAwarded: 0 };
    }
    if (answer.selectedIndex === null || answer.selectedIndex === undefined) {
      return { ...answer, isCorrect: false, marksAwarded: rules.unansweredMark };
    }
    const isCorrect = answer.selectedIndex === question.correctIndex;
    const marksAwarded = isCorrect ? rules.correctMark : rules.wrongMark;
    score += marksAwarded;
    return { ...answer, isCorrect, marksAwarded };
  });

  return { score, totalMarks, gradedAnswers: graded };
}

export function serializePublicProgram(doc: Record<string, unknown>) {
  const id = String(doc._id);
  const classLevels = ((doc.classLevels as number[]) || []).map(Number);
  return {
    _id: id,
    title: doc.title as string,
    slug: doc.slug as string,
    subtitle: (doc.subtitle as string) || "",
    image: (doc.image as string) || "",
    description: (doc.description as string) || "",
    deliveryMode: doc.deliveryMode as string,
    offlineType: (doc.offlineType as string) || null,
    accessType: (doc.accessType as string) || "public",
    isPaid: Boolean(doc.isPaid),
    feeAmount: Number(doc.feeAmount || 0),
    classLevels,
    classLabel: classRangeLabel(classLevels),
    startDate: new Date(doc.startDate as string).toISOString(),
    endDate: new Date(doc.endDate as string).toISOString(),
    dateLabel: formatExamDateRange(doc.startDate as string, doc.endDate as string),
    durationMinutes: Number(doc.durationMinutes || 20),
    totalMarks: Number(doc.totalMarks || 25),
    correctMark: Number(doc.correctMark ?? 1),
    wrongMark: Number(doc.wrongMark ?? 0),
    unansweredMark: Number(doc.unansweredMark ?? 0),
    maxAttempts: Number(doc.maxAttempts || 1),
    instructions: (doc.instructions as string) || "",
    markingRulesNote: (doc.markingRulesNote as string) || "",
    venue: (doc.venue as string) || "",
    scheduleNote: (doc.scheduleNote as string) || "",
    examTime: (doc.examTime as string) || "",
    subjectSyllabus: (doc.subjectSyllabus as string) || "",
    subjectSyllabusItems: normalizeSubjectSyllabus({
      subjectSyllabusItems: doc.subjectSyllabusItems as Array<{ name?: string; syllabus?: string }>,
      subjectSyllabus: doc.subjectSyllabus as string,
    }),
    enrollmentInfo: (doc.enrollmentInfo as string) || "",
    shuffleQuestions: Boolean(doc.shuffleQuestions ?? true),
    showLeaderboard: Boolean(doc.showLeaderboard ?? true),
    featured: Boolean(doc.featured),
    isLive: isProgramLive(doc.startDate as string, doc.endDate as string),
    requiresPayment: programRequiresPayment(doc as { deliveryMode: string; isPaid?: boolean; accessType?: string }),
    questionCount: Number(doc.questionCount ?? 0),
  };
}

export type PublicExamProgram = ReturnType<typeof serializePublicProgram>;

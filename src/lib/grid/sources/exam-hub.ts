import "server-only";

import { Types, type PipelineStage } from "mongoose";

import { runGridAggregate, type GridField } from "@/lib/grid/query";
import type { GridSource } from "@/lib/grid/registry";
import ExamAttempt from "@/models/ExamAttempt";
import ExamEnrollment from "@/models/ExamEnrollment";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";

const id = (value: unknown) => (value == null ? "" : String(value));
const iso = (value: unknown) => (value ? new Date(value as string).toISOString() : "");
const str = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value));
const num = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** A program id from the page params, or null when missing / not an ObjectId. */
export function examProgramObjectId(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  return /^[a-f\d]{24}$/i.test(raw) ? new Types.ObjectId(raw) : null;
}

const collection = (model: { collection: { collectionName: string } }) => model.collection.collectionName;

/** Looks up the program title / slug for enrollment and attempt rows. */
const programLookup: PipelineStage[] = [
  {
    $lookup: {
      from: collection(ExamProgram),
      let: { pid: "$programId" },
      pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$pid"] } } }, { $project: { title: 1, slug: 1 } }],
      as: "program",
    },
  },
  {
    $addFields: {
      programTitle: { $ifNull: [{ $first: "$program.title" }, "Deleted exam program"] },
      programSlug: { $ifNull: [{ $first: "$program.slug" }, ""] },
    },
  },
  { $project: { program: 0 } },
];

// ───────────── Programs ─────────────

const programFields: Record<string, GridField> = {
  title: { path: "title", type: "text" },
  slug: { path: "slug", type: "text" },
  deliveryMode: { path: "deliveryMode", type: "set" },
  offlineType: { path: "offlineType", type: "set" },
  accessType: { path: "accessType", type: "set" },
  isPaid: { path: "isPaid", type: "boolean" },
  feeAmount: { path: "feeAmount", type: "number" },
  classLevels: { path: "classLevels", type: "set", sortable: false },
  startDate: { path: "startDate", type: "date" },
  endDate: { path: "endDate", type: "date" },
  examTime: { path: "examTime", type: "text" },
  venue: { path: "venue", type: "text" },
  durationMinutes: { path: "durationMinutes", type: "number" },
  totalMarks: { path: "totalMarks", type: "number" },
  questionCount: { path: "questionCount", type: "number" },
  enrollmentCount: { path: "enrollmentCount", type: "number" },
  status: { path: "status", type: "set" },
  featured: { path: "featured", type: "boolean" },
  order: { path: "order", type: "number" },
  createdAt: { path: "createdAt", type: "date" },
};

type SyllabusItem = { name?: string; syllabus?: string; topics?: string[] };

export const examProgramsSource: GridSource = {
  access: "admin",
  run: async (request) => {
    const presetMatch: Record<string, unknown> =
      request.preset === "online"
        ? { deliveryMode: "online" }
        : request.preset === "offline"
          ? { deliveryMode: "offline" }
          : request.preset === "published"
            ? { status: "published" }
            : request.preset === "unpublished"
              ? { status: { $ne: "published" } }
              : {};
    const prepare: PipelineStage[] = [
      { $match: presetMatch },
      {
        $lookup: {
          from: collection(ExamQuestion),
          let: { pid: "$_id" },
          // Same rule as the public exam: legacy rows without isActive count as active.
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$programId", "$$pid"] }, { $ne: ["$isActive", false] }] } } }, { $count: "n" }],
          as: "questionsN",
        },
      },
      {
        $lookup: {
          from: collection(ExamEnrollment),
          let: { pid: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$programId", "$$pid"] } } }, { $count: "n" }],
          as: "enrollmentsN",
        },
      },
      {
        $addFields: {
          questionCount: { $ifNull: [{ $first: "$questionsN.n" }, 0] },
          enrollmentCount: { $ifNull: [{ $first: "$enrollmentsN.n" }, 0] },
        },
      },
      { $project: { questionsN: 0, enrollmentsN: 0 } },
    ];
    return runGridAggregate({
      model: ExamProgram as never,
      request,
      fields: programFields,
      searchPaths: ["title", "slug", "subtitle", "venue", "examTime"],
      prepare,
      defaultSort: { order: 1, createdAt: -1 },
      // The full program travels with the row: the view modal and edit form use it as is.
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          _id: id(doc._id),
          title: str(doc.title),
          slug: str(doc.slug),
          subtitle: str(doc.subtitle),
          image: str(doc.image),
          description: str(doc.description),
          deliveryMode: doc.deliveryMode === "offline" ? "offline" : "online",
          offlineType: doc.offlineType === "weekly" || doc.offlineType === "monthly" ? doc.offlineType : null,
          accessType: doc.accessType === "private" ? "private" : "public",
          isPaid: Boolean(doc.isPaid),
          feeAmount: num(doc.feeAmount),
          classLevels: Array.isArray(doc.classLevels) ? (doc.classLevels as unknown[]).map((level) => num(level)) : [],
          startDate: iso(doc.startDate),
          endDate: iso(doc.endDate),
          durationMinutes: num(doc.durationMinutes, 20),
          totalMarks: num(doc.totalMarks, 25),
          correctMark: num(doc.correctMark, 1),
          wrongMark: num(doc.wrongMark),
          unansweredMark: num(doc.unansweredMark),
          maxAttempts: num(doc.maxAttempts, 1),
          instructions: str(doc.instructions),
          markingRulesNote: str(doc.markingRulesNote),
          venue: str(doc.venue),
          scheduleNote: str(doc.scheduleNote),
          examTime: str(doc.examTime),
          subjectSyllabus: str(doc.subjectSyllabus),
          subjectSyllabusItems: (Array.isArray(doc.subjectSyllabusItems) ? (doc.subjectSyllabusItems as SyllabusItem[]) : []).map((item) => ({
            name: str(item.name),
            syllabus: str(item.syllabus),
            topics: Array.isArray(item.topics) ? item.topics.map(str) : [],
          })),
          enrollmentInfo: str(doc.enrollmentInfo),
          shuffleQuestions: doc.shuffleQuestions !== false,
          showLeaderboard: doc.showLeaderboard !== false,
          status: ["draft", "published", "hidden", "archived"].includes(str(doc.status)) ? str(doc.status) : "draft",
          featured: Boolean(doc.featured),
          order: num(doc.order),
          questionCount: num(doc.questionCount),
          enrollmentCount: num(doc.enrollmentCount),
          createdAt: iso(doc.createdAt),
        })),
    });
  },
};

// ───────────── Enrollments ─────────────

const enrollmentFields: Record<string, GridField> = {
  name: { path: "name", type: "text" },
  phone: { path: "phone", type: "text" },
  email: { path: "email", type: "text" },
  classLabel: { path: "classLabel", type: "text" },
  schoolName: { path: "schoolName", type: "text" },
  programTitle: { path: "programTitle", type: "text" },
  feeAmount: { path: "feeAmount", type: "number" },
  paymentStatus: { path: "paymentStatus", type: "set" },
  paymentMethod: { path: "paymentMethod", type: "set" },
  transactionId: { path: "transactionId", type: "text" },
  hasProof: { path: "hasProof", type: "boolean" },
  status: { path: "status", type: "set" },
  attemptsUsed: { path: "attemptsUsed", type: "number" },
  createdAt: { path: "createdAt", type: "date" },
  verifiedAt: { path: "verifiedAt", type: "date" },
};

export const examEnrollmentsSource: GridSource = {
  access: "admin",
  run: async (request) => {
    const programId = examProgramObjectId(request.params?.programId);
    const presetMatch: Record<string, unknown> =
      request.preset === "review"
        ? { paymentStatus: "submitted" }
        : request.preset === "confirmed"
          ? { status: "confirmed" }
          : request.preset === "cancelled"
            ? { status: "cancelled" }
            : request.preset === "unpaid"
              ? { paymentStatus: "pending" }
              : {};
    const prepare: PipelineStage[] = [
      { $match: { ...presetMatch, ...(programId ? { programId } : {}) } },
      { $project: { userAgent: 0, ip: 0 } },
      ...programLookup,
      {
        $addFields: {
          proofUrl: {
            $cond: [
              { $gt: [{ $strLenCP: { $ifNull: ["$paymentProof.previewUrl", ""] } }, 0] },
              "$paymentProof.previewUrl",
              { $ifNull: ["$paymentProof.url", ""] },
            ],
          },
        },
      },
      { $addFields: { hasProof: { $gt: [{ $strLenCP: "$proofUrl" }, 0] } } },
    ];
    return runGridAggregate({
      model: ExamEnrollment as never,
      request,
      fields: enrollmentFields,
      searchPaths: ["name", "phone", "email", "classLabel", "transactionId", "programTitle"],
      prepare,
      defaultSort: { createdAt: -1 },
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          programId: id(doc.programId),
          programTitle: str(doc.programTitle),
          programSlug: str(doc.programSlug),
          name: str(doc.name),
          phone: str(doc.phone),
          email: str(doc.email),
          classLabel: str(doc.classLabel),
          schoolName: str(doc.schoolName),
          feeAmount: num(doc.feeAmount),
          paymentStatus: str(doc.paymentStatus) || "not_required",
          paymentMethod: str(doc.paymentMethod),
          transactionId: str(doc.transactionId),
          proofUrl: str(doc.proofUrl),
          hasProof: Boolean(doc.hasProof),
          status: str(doc.status) || "pending",
          attemptsUsed: num(doc.attemptsUsed),
          adminNote: str(doc.adminNote),
          createdAt: iso(doc.createdAt),
          verifiedAt: iso(doc.verifiedAt),
        })),
    });
  },
};

// ───────────── Attempts ─────────────

const attemptFields: Record<string, GridField> = {
  name: { path: "name", type: "text" },
  phone: { path: "phone", type: "text" },
  programTitle: { path: "programTitle", type: "text" },
  status: { path: "status", type: "set" },
  score: { path: "score", type: "number" },
  totalMarks: { path: "totalMarks", type: "number" },
  percent: { path: "percent", type: "number" },
  durationSeconds: { path: "durationSeconds", type: "number" },
  startedAt: { path: "startedAt", type: "date" },
  submittedAt: { path: "submittedAt", type: "date" },
  ip: { path: "ip", type: "text" },
};

export const examAttemptsSource: GridSource = {
  access: "admin",
  run: async (request) => {
    const programId = examProgramObjectId(request.params?.programId);
    const presetMatch: Record<string, unknown> =
      request.preset === "submitted" || request.preset === "in_progress" || request.preset === "expired"
        ? { status: request.preset }
        : {};
    const prepare: PipelineStage[] = [
      { $match: { ...presetMatch, ...(programId ? { programId } : {}) } },
      // Answers can be long; the view modal loads them on demand.
      { $project: { answers: 0, userAgent: 0 } },
      ...programLookup,
      {
        $addFields: {
          percent: {
            $cond: [{ $gt: ["$totalMarks", 0] }, { $round: [{ $multiply: [{ $divide: ["$score", "$totalMarks"] }, 100] }, 1] }, null],
          },
        },
      },
    ];
    return runGridAggregate({
      model: ExamAttempt as never,
      request,
      fields: attemptFields,
      searchPaths: ["name", "phone", "ip", "programTitle"],
      prepare,
      defaultSort: { submittedAt: -1, createdAt: -1 },
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          programId: id(doc.programId),
          programTitle: str(doc.programTitle),
          programSlug: str(doc.programSlug),
          name: str(doc.name),
          phone: str(doc.phone),
          status: str(doc.status) || "in_progress",
          score: num(doc.score),
          totalMarks: num(doc.totalMarks),
          percent: doc.percent == null ? null : num(doc.percent),
          durationSeconds: num(doc.durationSeconds),
          startedAt: iso(doc.startedAt),
          expiresAt: iso(doc.expiresAt),
          submittedAt: iso(doc.submittedAt),
          ip: str(doc.ip),
        })),
    });
  },
};

// ───────────── Questions (one program at a time) ─────────────

const questionFields: Record<string, GridField> = {
  questionText: { path: "questionText", type: "text" },
  optionCount: { path: "optionCount", type: "number" },
  correctIndex: { path: "correctIndex", type: "number" },
  marks: { path: "marks", type: "number" },
  order: { path: "order", type: "number" },
  status: { path: "status", type: "set" },
  hasImage: { path: "hasImage", type: "boolean" },
  createdAt: { path: "createdAt", type: "date" },
  updatedAt: { path: "updatedAt", type: "date" },
};

export const examQuestionsSource: GridSource = {
  access: "admin",
  run: async (request) => {
    const programId = examProgramObjectId(request.params?.programId);
    // Questions always belong to one program; without one there is nothing to list.
    if (!programId) return { rows: [], total: 0 };
    const presetMatch: Record<string, unknown> =
      request.preset === "active"
        ? { isActive: { $ne: false } }
        : request.preset === "inactive"
          ? { isActive: false }
          : request.preset === "with-image"
            ? { image: { $nin: ["", null] } }
            : {};
    const prepare: PipelineStage[] = [
      { $match: { programId, ...presetMatch } },
      {
        $addFields: {
          optionCount: { $size: { $ifNull: ["$options", []] } },
          status: { $cond: [{ $eq: ["$isActive", false] }, "inactive", "active"] },
          hasImage: { $gt: [{ $strLenCP: { $ifNull: ["$image", ""] } }, 0] },
        },
      },
    ];
    return runGridAggregate({
      model: ExamQuestion as never,
      request,
      fields: questionFields,
      searchPaths: ["questionText", "options.text", "explanation"],
      prepare,
      defaultSort: { order: 1, createdAt: 1 },
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          programId: id(doc.programId),
          questionText: str(doc.questionText),
          image: str(doc.image),
          options: (Array.isArray(doc.options) ? (doc.options as { text?: string }[]) : []).map((option) => ({ text: str(option.text) })),
          optionCount: num(doc.optionCount),
          correctIndex: num(doc.correctIndex),
          explanation: str(doc.explanation),
          marks: num(doc.marks, 1),
          order: num(doc.order),
          isActive: doc.isActive !== false,
          status: str(doc.status),
          hasImage: Boolean(doc.hasImage),
          createdAt: iso(doc.createdAt),
          updatedAt: iso(doc.updatedAt),
        })),
    });
  },
};

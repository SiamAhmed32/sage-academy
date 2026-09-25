import "server-only";

import type { Model, PipelineStage } from "mongoose";

import { runGridAggregate, runGridFind, type GridField } from "@/lib/grid/query";
import type { GridSource } from "@/lib/grid/registry";
import AdmissionRequest from "@/models/AdmissionRequest";
import AssessmentRegistration from "@/models/AssessmentRegistration";
import ContactRequest from "@/models/ContactRequest";
import FreeClassLead from "@/models/FreeClassLead";
import QuizQuestion from "@/models/QuizQuestion";
import QuizSubmission from "@/models/QuizSubmission";

type Doc = Record<string, unknown>;

const id = (value: unknown) => (value == null ? "" : String(value));
const str = (value: unknown) => (value == null ? "" : String(value));
const iso = (value: unknown) => (value ? new Date(value as string).toISOString() : "");
const isoOrNull = (value: unknown) => (value ? new Date(value as string).toISOString() : null);
const asModel = (model: unknown) => model as Model<Doc>;

/** Start of today in Dhaka. */
export const dhakaToday = () =>
  new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date())}T00:00:00+06:00`);
/** Rolling window, e.g. the last 7 days. */
export const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

/** Shared by the status tiles and the grid so a tile's count matches the rows it opens. */
function statusPreset(preset: string | undefined, statuses: readonly string[]): Record<string, unknown> | null {
  if (!preset) return {};
  if (statuses.includes(preset)) return { status: preset };
  if (preset === "today") return { createdAt: { $gte: dhakaToday() } };
  if (preset === "week") return { createdAt: { $gte: daysAgo(7) } };
  return null;
}

// ───────────── Admissions ─────────────

export const ADMISSION_STATUSES = ["new", "contacted", "qualified", "closed", "spam"] as const;

export function admissionPresetMatch(preset?: string): Record<string, unknown> {
  if (preset === "archived") return { isArchived: true };
  const active = { isArchived: { $ne: true } };
  if (preset === "follow-up") return { ...active, status: { $in: ["contacted", "qualified"] } };
  return { ...active, ...(statusPreset(preset, ADMISSION_STATUSES) ?? {}) };
}

const admissionFields: Record<string, GridField> = {
  studentName: { path: "studentName", type: "text" },
  phone: { path: "phone", type: "text" },
  studentWhatsapp: { path: "studentWhatsapp", type: "text" },
  guardianName: { path: "guardianName", type: "text" },
  email: { path: "email", type: "text" },
  className: { path: "className", type: "set" },
  schoolName: { path: "schoolName", type: "text" },
  academicVersion: { path: "academicVersion", type: "set" },
  studentGender: { path: "studentGender", type: "set" },
  preferredBatch: { path: "preferredBatch", type: "text" },
  adminNote: { path: "adminNote", type: "text" },
  status: { path: "status", type: "set" },
  createdAt: { path: "createdAt", type: "date" },
};

export const admissionsSource: GridSource = {
  access: "staff",
  run: (request) =>
    runGridFind({
      model: asModel(AdmissionRequest),
      request,
      fields: admissionFields,
      searchPaths: ["studentName", "nameBangla", "phone", "studentWhatsapp", "guardianName", "fatherName", "email", "schoolName"],
      base: admissionPresetMatch(request.preset),
      defaultSort: { createdAt: -1 },
      select: "-utmContent -utmTerm -attributionReferrer -attributionLandingPath -attributionCapturedAt",
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          _id: id(doc._id),
          studentName: str(doc.studentName),
          nameBangla: str(doc.nameBangla),
          guardianName: str(doc.guardianName),
          fatherName: str(doc.fatherName),
          motherName: str(doc.motherName),
          phone: str(doc.phone),
          studentWhatsapp: str(doc.studentWhatsapp),
          email: str(doc.email),
          className: str(doc.className),
          schoolName: str(doc.schoolName),
          section: str(doc.section),
          classRoll: str(doc.classRoll),
          studentDateOfBirth: isoOrNull(doc.studentDateOfBirth),
          studentGender: str(doc.studentGender),
          preferredBatch: str(doc.preferredBatch),
          academicVersion: str(doc.academicVersion),
          interestedSubjects: str(doc.interestedSubjects),
          admissionDate: isoOrNull(doc.admissionDate),
          presentAddress: str(doc.presentAddress),
          permanentAddress: str(doc.permanentAddress),
          message: str(doc.message),
          status: str(doc.status) || "new",
          adminNote: str(doc.adminNote),
          isArchived: Boolean(doc.isArchived),
          isRead: Boolean(doc.isRead),
          createdAt: iso(doc.createdAt),
        })),
    }),
};

// ───────────── Contact messages ─────────────

export const CONTACT_STATUSES = ["new", "contacted", "closed", "spam"] as const;

export function contactPresetMatch(preset?: string): Record<string, unknown> {
  return statusPreset(preset, CONTACT_STATUSES) ?? {};
}

const contactFields: Record<string, GridField> = {
  name: { path: "name", type: "text" },
  phone: { path: "phone", type: "text" },
  message: { path: "message", type: "text" },
  source: { path: "source", type: "text" },
  utmCampaign: { path: "utmCampaign", type: "text" },
  adminNote: { path: "adminNote", type: "text" },
  status: { path: "status", type: "set" },
  createdAt: { path: "createdAt", type: "date" },
};

export const contactsSource: GridSource = {
  access: "staff",
  run: (request) =>
    runGridFind({
      model: asModel(ContactRequest),
      request,
      fields: contactFields,
      searchPaths: ["name", "phone", "message"],
      base: contactPresetMatch(request.preset),
      defaultSort: { createdAt: -1 },
      select: "name phone message source status isRead adminNote utmSource utmMedium utmCampaign attributionSubmitPath createdAt",
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          _id: id(doc._id),
          name: str(doc.name),
          phone: str(doc.phone),
          message: str(doc.message),
          source: str(doc.source),
          status: str(doc.status) || "new",
          isRead: Boolean(doc.isRead),
          adminNote: str(doc.adminNote),
          utmSource: str(doc.utmSource),
          utmMedium: str(doc.utmMedium),
          utmCampaign: str(doc.utmCampaign),
          attributionSubmitPath: str(doc.attributionSubmitPath),
          createdAt: iso(doc.createdAt),
        })),
    }),
};

// ───────────── Free class leads ─────────────

export const FREE_CLASS_STATUSES = ["new", "contacted", "scheduled", "attended", "invalid", "closed"] as const;

export function freeClassPresetMatch(preset?: string): Record<string, unknown> {
  return statusPreset(preset, FREE_CLASS_STATUSES) ?? {};
}

const freeClassFields: Record<string, GridField> = {
  name: { path: "name", type: "text" },
  phone: { path: "phone", type: "text" },
  classLabel: { path: "classLabel", type: "set" },
  subject: { path: "subject", type: "text" },
  source: { path: "source", type: "set" },
  adminNote: { path: "adminNote", type: "text" },
  status: { path: "status", type: "set" },
  createdAt: { path: "createdAt", type: "date" },
};

export const freeClassLeadsSource: GridSource = {
  access: "staff",
  run: (request) =>
    runGridFind({
      model: asModel(FreeClassLead),
      request,
      fields: freeClassFields,
      searchPaths: ["name", "phone", "subject", "classLabel", "adminNote"],
      base: freeClassPresetMatch(request.preset),
      defaultSort: { createdAt: -1 },
      select: "name phone classLabel subject status adminNote source createdAt",
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          name: str(doc.name),
          phone: str(doc.phone),
          classLabel: str(doc.classLabel),
          subject: str(doc.subject),
          status: str(doc.status) || "new",
          adminNote: str(doc.adminNote),
          source: str(doc.source),
          createdAt: iso(doc.createdAt),
        })),
    }),
};

// ───────────── Model test / exam registrations ─────────────

export const ASSESSMENT_STATUSES = ["new", "contacted", "confirmed", "attended", "cancelled", "invalid"] as const;

export function assessmentPresetMatch(preset?: string): Record<string, unknown> {
  if (preset === "modelTest" || preset === "exam") return { assessmentKind: preset };
  return statusPreset(preset, ASSESSMENT_STATUSES) ?? {};
}

const assessmentFields: Record<string, GridField> = {
  assessmentTitle: { path: "assessmentTitle", type: "text" },
  assessmentKind: { path: "assessmentKind", type: "set" },
  assessmentType: { path: "assessmentType", type: "set" },
  name: { path: "name", type: "text" },
  phone: { path: "phone", type: "text" },
  classLabel: { path: "classLabel", type: "set" },
  version: { path: "version", type: "set" },
  schoolName: { path: "schoolName", type: "text" },
  selectedSubjects: { path: "selectedSubjects", type: "text" },
  applicantType: { path: "applicantType", type: "set" },
  message: { path: "message", type: "text" },
  adminNote: { path: "adminNote", type: "text" },
  status: { path: "status", type: "set" },
  createdAt: { path: "createdAt", type: "date" },
};

export const assessmentRegistrationsSource: GridSource = {
  access: "staff",
  run: (request) =>
    runGridFind({
      model: asModel(AssessmentRegistration),
      request,
      fields: assessmentFields,
      searchPaths: [
        "assessmentTitle",
        "assessmentType",
        "name",
        "phone",
        "classLabel",
        "version",
        "schoolName",
        "selectedSubjects",
        "message",
        "adminNote",
      ],
      base: assessmentPresetMatch(request.preset),
      defaultSort: { createdAt: -1 },
      select: "-ip -userAgent -assessmentModel",
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          assessmentKind: str(doc.assessmentKind),
          assessmentId: id(doc.assessmentId),
          assessmentTitle: str(doc.assessmentTitle),
          assessmentType: str(doc.assessmentType),
          name: str(doc.name),
          phone: str(doc.phone),
          classLabel: str(doc.classLabel),
          version: str(doc.version),
          schoolName: str(doc.schoolName),
          selectedSubjects: Array.isArray(doc.selectedSubjects) ? doc.selectedSubjects.map(str) : [],
          applicantType: str(doc.applicantType),
          message: str(doc.message),
          status: str(doc.status) || "new",
          adminNote: str(doc.adminNote),
          createdAt: iso(doc.createdAt),
        })),
    }),
};

// ───────────── Quiz leads ─────────────

export const QUIZ_STATUSES = ["new", "contacted", "invalid", "qualified"] as const;

export function quizPresetMatch(preset?: string): Record<string, unknown> {
  if (preset === "whatsapp") return { whatsappRequested: true };
  return statusPreset(preset, QUIZ_STATUSES) ?? {};
}

/** Class level as a zero-padded string ("06", "10") so the class filter sends plain strings and sorts in order. */
export const quizClassKey = (level: number) => String(level).padStart(2, "0");

const quizFields: Record<string, GridField> = {
  name: { path: "name", type: "text" },
  phone: { path: "phone", type: "text" },
  classLevel: { path: "classKey", type: "set" },
  score: { path: "score", type: "number" },
  totalQuestions: { path: "totalQuestions", type: "number" },
  whatsappRequested: { path: "whatsappRequested", type: "boolean" },
  adminNote: { path: "adminNote", type: "text" },
  status: { path: "status", type: "set" },
  createdAt: { path: "createdAt", type: "date" },
};

export const quizLeadsSource: GridSource = {
  access: "staff",
  run: (request) => {
    const prepare: PipelineStage[] = [
      { $match: quizPresetMatch(request.preset) },
      {
        $addFields: {
          classKey: {
            $cond: [
              { $lt: ["$classLevel", 10] },
              { $concat: ["0", { $toString: "$classLevel" }] },
              { $toString: "$classLevel" },
            ],
          },
        },
      },
      { $project: { "answers.selectedOptionIndex": 0 } },
    ];
    return runGridAggregate({
      model: QuizSubmission as never,
      request,
      fields: quizFields,
      searchPaths: ["name", "phone", "adminNote"],
      prepare,
      defaultSort: { createdAt: -1 },
      toRows: async (docs) => {
        // Question text and explanation feed the WhatsApp result message.
        const questionIds = [
          ...new Set(
            docs.flatMap((doc) => ((doc.answers as { question?: unknown }[] | undefined) ?? []).map((answer) => id(answer.question)).filter(Boolean))
          ),
        ];
        const questions = questionIds.length
          ? await asModel(QuizQuestion).find({ _id: { $in: questionIds } }).select("questionText explanation").lean<Doc[]>()
          : [];
        const byId = new Map(questions.map((question) => [id(question._id), question]));
        return docs.map((doc) => ({
          id: id(doc._id),
          name: str(doc.name),
          phone: str(doc.phone),
          classLevel: Number(doc.classLevel) || 0,
          score: Number(doc.score) || 0,
          totalQuestions: Number(doc.totalQuestions) || 0,
          whatsappRequested: Boolean(doc.whatsappRequested),
          status: str(doc.status) || "new",
          adminNote: str(doc.adminNote),
          createdAt: iso(doc.createdAt),
          answers: ((doc.answers as { question?: unknown; isCorrect?: boolean }[] | undefined) ?? []).map((answer) => {
            const question = byId.get(id(answer.question));
            return {
              isCorrect: Boolean(answer.isCorrect),
              questionText: str(question?.questionText),
              explanation: str(question?.explanation),
            };
          }),
        }));
      },
    });
  },
};

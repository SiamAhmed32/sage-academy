import "server-only";

import type { Model, PipelineStage } from "mongoose";

import { runGridAggregate, runGridFind, type GridField } from "@/lib/grid/query";
import type { GridSource } from "@/lib/grid/registry";
import Exam from "@/models/Exam";
import ModelTest from "@/models/ModelTest";
import QuizQuestion from "@/models/QuizQuestion";

const id = (value: unknown) => (value == null ? "" : String(value));
const iso = (value: unknown) => (value ? new Date(value as string).toISOString() : "");
const str = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value));
const strings = (value: unknown) => (Array.isArray(value) ? value.map(str).filter(Boolean) : []);
const numbers = (value: unknown) => (Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : []);

// ───────────── Exams and model tests ─────────────

const ASSESSMENT_STATUSES = ["draft", "published", "hidden", "archived"] as const;

const assessmentFields: Record<string, GridField> = {
  title: { path: "title", type: "text" },
  slug: { path: "slug", type: "text" },
  examType: { path: "examType", type: "set" },
  // An array of numbers: the set filter's "$in" also tries the numeric form of each value.
  classLevels: { path: "classLevels", type: "set", sortable: false },
  version: { path: "version", type: "set" },
  subjects: { path: "classSpecificInfo.subjects", type: "text", sortable: false },
  schoolFocus: { path: "schoolFocus", type: "text", sortable: false },
  startDate: { path: "startDate", type: "date" },
  endDate: { path: "endDate", type: "date" },
  status: { path: "status", type: "set" },
  featured: { path: "featured", type: "boolean" },
  order: { path: "order", type: "number" },
  createdAt: { path: "createdAt", type: "date" },
  updatedAt: { path: "updatedAt", type: "date" },
};

type FeeLean = { classLevel?: number; label?: string; sageStudentFee?: number; outsideStudentFee?: number };
type RoutineLean = { day?: string; time?: string; subject?: string };
type ClassInfoLean = { classLevel?: number; subjects?: string[]; routine?: RoutineLean[] };

type AssessmentLean = {
  _id: unknown;
  title?: string;
  slug?: string;
  image?: string;
  examType?: string;
  classLevels?: number[];
  version?: string;
  schoolFocus?: string[];
  startDate?: Date;
  endDate?: Date;
  routineTitle?: string;
  routineSubtitle?: string;
  scheduleNote?: string;
  fees?: FeeLean[];
  classSpecificInfo?: ClassInfoLean[];
  features?: string[];
  status?: string;
  featured?: boolean;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

/** Preset → page scope. By default the archive is left out, as on the old list. */
export function assessmentPresetMatch(preset: string | undefined): Record<string, unknown> {
  if (preset && (ASSESSMENT_STATUSES as readonly string[]).includes(preset)) return { status: preset };
  return { status: { $ne: "archived" } };
}

function serializeAssessment(doc: AssessmentLean, isExam: boolean) {
  const classSpecificInfo = (Array.isArray(doc.classSpecificInfo) ? doc.classSpecificInfo : []).map((info) => ({
    classLevel: Number(info.classLevel) || 0,
    subjects: strings(info.subjects),
    routine: (Array.isArray(info.routine) ? info.routine : []).map((entry) => ({
      day: str(entry.day),
      time: str(entry.time),
      subject: str(entry.subject),
    })),
  }));
  const status = str(doc.status);
  return {
    id: id(doc._id),
    title: str(doc.title),
    slug: str(doc.slug),
    image: str(doc.image),
    examType: isExam ? str(doc.examType) || "Regular Exam" : "",
    classLevels: numbers(doc.classLevels),
    version: (["bangla", "english", "both"].includes(str(doc.version)) ? str(doc.version) : "both") as "bangla" | "english" | "both",
    schoolFocus: strings(doc.schoolFocus),
    startDate: iso(doc.startDate),
    endDate: iso(doc.endDate),
    routineTitle: str(doc.routineTitle),
    routineSubtitle: str(doc.routineSubtitle),
    scheduleNote: str(doc.scheduleNote),
    fees: (Array.isArray(doc.fees) ? doc.fees : []).map((fee) => ({
      classLevel: Number(fee.classLevel) || 0,
      label: str(fee.label),
      sageStudentFee: Number(fee.sageStudentFee) || 0,
      outsideStudentFee: Number(fee.outsideStudentFee) || 0,
    })),
    classSpecificInfo,
    subjects: [...new Set(classSpecificInfo.flatMap((info) => info.subjects))],
    features: strings(doc.features),
    status: ((ASSESSMENT_STATUSES as readonly string[]).includes(status) ? status : "draft") as (typeof ASSESSMENT_STATUSES)[number],
    featured: Boolean(doc.featured),
    order: Number(doc.order) || 0,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

function assessmentSource(model: Model<unknown>, isExam: boolean): GridSource {
  return {
    access: "staff",
    run: async (request) =>
      runGridFind({
        model,
        request,
        fields: assessmentFields,
        searchPaths: isExam
          ? ["title", "slug", "examType", "schoolFocus", "classSpecificInfo.subjects"]
          : ["title", "slug", "schoolFocus", "classSpecificInfo.subjects"],
        base: assessmentPresetMatch(request.preset),
        defaultSort: { order: 1, createdAt: -1 },
        select:
          "title slug image examType classLevels version schoolFocus startDate endDate routineTitle routineSubtitle scheduleNote fees classSpecificInfo features status featured order createdAt updatedAt",
        toRows: (docs) => (docs as AssessmentLean[]).map((doc) => serializeAssessment(doc, isExam)),
      }),
  };
}

export const examsSource = assessmentSource(Exam as Model<unknown>, true);
export const modelTestsSource = assessmentSource(ModelTest as Model<unknown>, false);

// ───────────── Quiz questions ─────────────

const quizFields: Record<string, GridField> = {
  questionText: { path: "questionText", type: "text" },
  // A number: the set filter's "$in" also tries the numeric form of each value.
  classLevel: { path: "classLevel", type: "set" },
  correctAnswer: { path: "correctAnswer", type: "text" },
  optionCount: { path: "optionCount", type: "number" },
  explanation: { path: "explanation", type: "text" },
  status: { path: "status", type: "set" },
  order: { path: "order", type: "number" },
  createdAt: { path: "createdAt", type: "date" },
  updatedAt: { path: "updatedAt", type: "date" },
};

export const noExplanation = { $or: [{ explanation: "" }, { explanation: null }, { explanation: { $exists: false } }] };

export const quizQuestionsSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const presetMatch: Record<string, unknown> =
      request.preset === "active"
        ? { isActive: { $ne: false } }
        : request.preset === "inactive"
          ? { isActive: false }
          : request.preset === "no-explanation"
            ? noExplanation
            : {};
    const prepare: PipelineStage[] = [
      { $match: presetMatch },
      {
        $addFields: {
          correctAnswer: { $first: { $filter: { input: { $ifNull: ["$options", []] }, as: "option", cond: { $eq: ["$$option.isCorrect", true] } } } },
          optionCount: { $size: { $ifNull: ["$options", []] } },
          status: { $cond: [{ $eq: ["$isActive", false] }, "inactive", "active"] },
        },
      },
      { $addFields: { correctAnswer: { $ifNull: ["$correctAnswer.text", ""] } } },
    ];
    return runGridAggregate({
      model: QuizQuestion as never,
      request,
      fields: quizFields,
      searchPaths: ["questionText", "explanation", "options.text"],
      prepare,
      defaultSort: { classLevel: 1, order: 1, createdAt: -1 },
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          classLevel: Number(doc.classLevel) || 0,
          questionText: str(doc.questionText),
          options: (Array.isArray(doc.options) ? (doc.options as { text?: unknown; isCorrect?: unknown }[]) : []).map((option) => ({
            text: str(option.text),
            isCorrect: option.isCorrect === true,
          })),
          correctAnswer: str(doc.correctAnswer),
          optionCount: Number(doc.optionCount) || 0,
          explanation: str(doc.explanation),
          isActive: doc.isActive !== false,
          status: str(doc.status),
          order: Number(doc.order) || 0,
          createdAt: iso(doc.createdAt),
          updatedAt: iso(doc.updatedAt),
        })),
    });
  },
};

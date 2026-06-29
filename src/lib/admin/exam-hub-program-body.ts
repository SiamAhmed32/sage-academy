import { NextRequest } from "next/server";

import { uploadExamHubImage } from "@/lib/upload-exam-hub-image";
import {
  parseSubjectSyllabusItems,
  sanitizeSubjectSyllabusItems,
  syncLegacySubjectSyllabus,
} from "@/lib/exam-hub-syllabus";
import { createExamProgramSchema, updateExamProgramSchema } from "@/schemas/exam-hub";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formBool(formData: FormData, key: string) {
  return formValue(formData, key) === "true";
}

function formNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formValue(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function parseClassLevels(raw: string) {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return raw
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v));
  }
}

async function buildProgramPayload(formData: FormData) {
  const file = formData.get("imageFile");
  const uploadedImage =
    file instanceof File && file.size > 0 ? await uploadExamHubImage(file) : "";

  const subjectSyllabusItems = sanitizeSubjectSyllabusItems(
    parseSubjectSyllabusItems(formValue(formData, "subjectSyllabusItems"))
  );
  const legacySubjectSyllabus = formValue(formData, "subjectSyllabus").trim();

  return {
    title: formValue(formData, "title"),
    slug: formValue(formData, "slug") || undefined,
    subtitle: formValue(formData, "subtitle"),
    description: formValue(formData, "description"),
    image: uploadedImage || formValue(formData, "image"),
    deliveryMode: formValue(formData, "deliveryMode") || "online",
    offlineType:
      formValue(formData, "deliveryMode") === "offline"
        ? formValue(formData, "offlineType") || "weekly"
        : null,
    accessType: formValue(formData, "accessType") || "public",
    isPaid: formBool(formData, "isPaid"),
    feeAmount: formNumber(formData, "feeAmount"),
    classLevels: parseClassLevels(formValue(formData, "classLevels")),
    startDate: formValue(formData, "startDate"),
    endDate: formValue(formData, "endDate"),
    durationMinutes: formNumber(formData, "durationMinutes", 20),
    totalMarks: formNumber(formData, "totalMarks", 25),
    correctMark: formNumber(formData, "correctMark", 1),
    wrongMark: formNumber(formData, "wrongMark", 0),
    unansweredMark: formNumber(formData, "unansweredMark", 0),
    maxAttempts: formNumber(formData, "maxAttempts", 1),
    instructions: formValue(formData, "instructions"),
    markingRulesNote: formValue(formData, "markingRulesNote"),
    venue: formValue(formData, "venue"),
    scheduleNote: formValue(formData, "scheduleNote"),
    examTime: formValue(formData, "examTime"),
    subjectSyllabusItems,
    subjectSyllabus:
      subjectSyllabusItems.length > 0
        ? syncLegacySubjectSyllabus(subjectSyllabusItems)
        : legacySubjectSyllabus,
    enrollmentInfo: formValue(formData, "enrollmentInfo"),
    shuffleQuestions: formBool(formData, "shuffleQuestions"),
    showLeaderboard: formBool(formData, "showLeaderboard"),
    status: formValue(formData, "status") || "draft",
    featured: formBool(formData, "featured"),
    order: formNumber(formData, "order"),
  };
}

export async function parseCreateExamProgramBody(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    return createExamProgramSchema.parse(await buildProgramPayload(await req.formData()));
  }
  const body = await req.json();
  return createExamProgramSchema.parse(prepareJsonProgramBody(body));
}

export async function parseUpdateExamProgramBody(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    return updateExamProgramSchema.parse(await buildProgramPayload(await req.formData()));
  }
  const body = await req.json();
  return updateExamProgramSchema.parse(prepareJsonProgramBody(body));
}

function prepareJsonProgramBody(body: Record<string, unknown>) {
  const subjectSyllabusItems = sanitizeSubjectSyllabusItems(parseSubjectSyllabusItems(body.subjectSyllabusItems));
  const legacySubjectSyllabus =
    typeof body.subjectSyllabus === "string" ? body.subjectSyllabus.trim() : "";

  return {
    ...body,
    subjectSyllabusItems,
    subjectSyllabus:
      subjectSyllabusItems.length > 0
        ? syncLegacySubjectSyllabus(subjectSyllabusItems)
        : legacySubjectSyllabus,
  };
}

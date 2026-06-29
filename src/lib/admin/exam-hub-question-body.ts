import { NextRequest } from "next/server";

import { uploadExamHubImage } from "@/lib/upload-exam-hub-image";
import { createExamQuestionSchema, updateExamQuestionSchema } from "@/schemas/exam-hub";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formBool(formData: FormData, key: string) {
  return formValue(formData, key) === "true";
}

/** Checkbox is on unless explicitly sent as "false". */
function formActiveFlag(formData: FormData, key: string) {
  if (!formData.has(key)) return true;
  return formValue(formData, key) !== "false";
}

function formNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formValue(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function parseOptions(raw: string) {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function buildQuestionPayload(formData: FormData) {
  const file = formData.get("imageFile");
  const uploadedImage =
    file instanceof File && file.size > 0 ? await uploadExamHubImage(file) : "";

  return {
    programId: formValue(formData, "programId") || undefined,
    questionText: formValue(formData, "questionText"),
    image: uploadedImage || formValue(formData, "image"),
    options: parseOptions(formValue(formData, "options")),
    correctIndex: formNumber(formData, "correctIndex"),
    explanation: formValue(formData, "explanation"),
    marks: formNumber(formData, "marks", 1),
    order: formNumber(formData, "order"),
    isActive: formActiveFlag(formData, "isActive"),
  };
}

export async function parseCreateExamQuestionBody(req: NextRequest, programId: string) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    return createExamQuestionSchema.parse({
      ...(await buildQuestionPayload(await req.formData())),
      programId,
    });
  }
  return createExamQuestionSchema.parse({ ...(await req.json()), programId });
}

export async function parseUpdateExamQuestionBody(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    return updateExamQuestionSchema.parse(await buildQuestionPayload(await req.formData()));
  }
  return updateExamQuestionSchema.parse(await req.json());
}

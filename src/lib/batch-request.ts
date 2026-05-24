import { buildBatchCode, buildBatchSlug, getBatchTitle } from "@/lib/batch-code";
import { uploadBatchImage } from "@/lib/upload-batch-image";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bool(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

function numberValue(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : 0;
}

function parseSubjects(value: string) {
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export async function batchPayloadFromFormData(formData: FormData) {
  const file = formData.get("imageFile");
  const uploadedImage =
    file instanceof File && file.size > 0 ? await uploadBatchImage(file) : "";
  const classLevel = numberValue(formData, "classLevel");
  const genderGroup = text(formData, "genderGroup") || "male";
  const version = text(formData, "version") || "bangla";
  const batchCode = buildBatchCode({ classLevel, genderGroup, version });
  const feature1 = text(formData, "feature1");
  const feature2 = text(formData, "feature2");
  const feature3 = text(formData, "feature3");
  const feature4 = text(formData, "feature4");

  return {
    title: getBatchTitle(classLevel),
    slug: buildBatchSlug(batchCode),
    batchCode,
    image: uploadedImage || text(formData, "image"),
    shift: batchCode,
    classLevel,
    genderGroup,
    version,
    feature1,
    feature2,
    feature3,
    feature4,
    features: [feature1, feature2, feature3, feature4],
    subjects: parseSubjects(text(formData, "subjectsJson")),
    overview: text(formData, "overview"),
    routineNote: text(formData, "routineNote"),
    status: text(formData, "status") || "ভর্তি চলছে",
    totalSeats: numberValue(formData, "totalSeats"),
    availableSeats: numberValue(formData, "availableSeats"),
    isActive: bool(formData, "isActive"),
    websiteVisible: bool(formData, "websiteVisible"),
    featured: bool(formData, "featured"),
    order: numberValue(formData, "order"),
  };
}

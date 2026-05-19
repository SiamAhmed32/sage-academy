import type { Model } from "mongoose";

import { getClassLabel, toBanglaDigits } from "@/constants/class-levels";
import Exam from "@/models/Exam";
import ModelTest from "@/models/ModelTest";
import type { CreateExamInput, CreateModelTestInput } from "@/schemas/assessment";

export type AssessmentKind = "modelTest" | "exam";

export type PublicAssessment = {
  _id: string;
  kind: AssessmentKind;
  title: string;
  slug: string;
  image: string;
  href: string;
  badge: string;
  examType?: string;
  classLevels: number[];
  classLabel: string;
  version: "bangla" | "english" | "both";
  versionLabel: string;
  subjects: string[];
  subjectCountLabel: string;
  schoolFocus: string[];
  startDate: string;
  endDate: string;
  dateLabel: string;
  routineTitle: string;
  routineSubtitle: string;
  scheduleNote: string;
  fees: Array<{ classLevel?: number; label: string; sageStudentFee: number; outsideStudentFee: number }>;
  feePreview: string;
  routine: Array<{ day: string; time: string; subject: string }>;
  features: string[];
  status: string;
  featured: boolean;
  order: number;
};

export function slugifyAssessment(input: string) {
  const normalized = input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `assessment-${Date.now()}`;
}

export function versionLabel(version: string) {
  if (version === "bangla") return "বাংলা ভার্সন";
  if (version === "english") return "English Version";
  return "বাংলা + English";
}

export function classRangeLabel(levels: number[]) {
  const sorted = [...new Set(levels)].sort((a, b) => a - b);
  if (sorted.length === 0) return "শ্রেণি নির্ধারিত নয়";
  if (sorted.length === 1) return getClassLabel(sorted[0]);
  return `${getClassLabel(sorted[0])} - ${getClassLabel(sorted[sorted.length - 1])}`;
}

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString("bn-BD")}`;
}

function dateLabel(startDate: Date | string, endDate: Date | string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startText = start.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
  const endText = end.toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });
  return start.toDateString() === end.toDateString() ? endText : `${startText} - ${endText}`;
}

function feePreview(fees: PublicAssessment["fees"]) {
  const first = fees[0];
  if (!first) return "ফি জানুন";
  if (first.sageStudentFee && first.outsideStudentFee) {
    return `SAGE ${money(first.sageStudentFee)} · Others ${money(first.outsideStudentFee)}`;
  }
  const amount = first.sageStudentFee || first.outsideStudentFee;
  return amount ? money(amount) : "ফি জানুন";
}

export function serializeAssessment(doc: any, kind: AssessmentKind): PublicAssessment {
  const raw = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const id = raw._id?.toString?.() ?? String(raw._id);
  const classLevels = (raw.classLevels || []).map((n: unknown) => Number(n)).filter(Boolean);
  const subjects = raw.subjects || [];
  const fees = (raw.fees || []).map((fee: any) => ({
    classLevel: Number(fee.classLevel || 0) || undefined,
    label: fee.label || "",
    sageStudentFee: Number(fee.sageStudentFee || 0),
    outsideStudentFee: Number(fee.outsideStudentFee || 0),
  }));
  const routine = (raw.routine || []).map((entry: any) => ({
    day: entry.day || "",
    time: entry.time || "",
    subject: entry.subject || "",
  })).filter((entry: any) => entry.day && entry.time && entry.subject);

  return {
    _id: id,
    kind,
    title: raw.title,
    slug: raw.slug,
    image: raw.image || "",
    href: `/assessments/${kind === "modelTest" ? "model-tests" : "exams"}/${raw.slug}`,
    badge: kind === "modelTest" ? "Model Test" : raw.examType || "Exam",
    examType: raw.examType,
    classLevels,
    classLabel: classRangeLabel(classLevels),
    version: raw.version,
    versionLabel: versionLabel(raw.version),
    subjects,
    subjectCountLabel: `${toBanglaDigits(subjects.length)}টি বিষয়`,
    schoolFocus: raw.schoolFocus || [],
    startDate: new Date(raw.startDate).toISOString(),
    endDate: new Date(raw.endDate).toISOString(),
    dateLabel: dateLabel(raw.startDate, raw.endDate),
    routineTitle: raw.routineTitle || "",
    routineSubtitle: raw.routineSubtitle || "",
    scheduleNote: raw.scheduleNote || "",
    fees,
    feePreview: feePreview(fees),
    routine,
    features: raw.features || [],
    status: raw.status,
    featured: Boolean(raw.featured),
    order: Number(raw.order || 0),
  };
}

export function activeAssessmentQuery(featuredOnly = false): Record<string, unknown> {
  return {
    status: "published",
    ...(featuredOnly ? { featured: true } : {}),
    endDate: { $gte: new Date() },
  };
}

export async function getPublicAssessments({ featuredOnly = false, limit = 6 } = {}) {
  const [modelTests, exams] = await Promise.all([
    ModelTest.find(activeAssessmentQuery(featuredOnly)).sort({ order: 1, startDate: 1 }).limit(limit).lean(),
    Exam.find(activeAssessmentQuery(featuredOnly)).sort({ order: 1, startDate: 1 }).limit(limit).lean(),
  ]);
  return [
    ...modelTests.map((item) => serializeAssessment(item, "modelTest")),
    ...exams.map((item) => serializeAssessment(item, "exam")),
  ]
    .sort((a, b) => a.order - b.order || new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, limit);
}

export function assessmentModel(kind: AssessmentKind): Model<any> {
  return kind === "modelTest" ? ModelTest : Exam;
}

export function assessmentModelName(kind: AssessmentKind) {
  return kind === "modelTest" ? "ModelTest" : "Exam";
}

export function parseCsvList(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseClassLevels(raw: FormDataEntryValue | null) {
  return parseCsvList(raw)
    .map((item) => Number(item.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))))
    .filter((item) => Number.isInteger(item));
}

export function parseFees(raw: FormDataEntryValue | null) {
  const lines = String(raw ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line) => {
    const [label = "", sage = "0", outside = "0"] = line.split("|").map((part) => part.trim());
    return {
      classLevel: undefined,
      label,
      sageStudentFee: Number(sage) || 0,
      outsideStudentFee: Number(outside) || 0,
    };
  });
}

function parseJsonArray<T>(raw: FormDataEntryValue | null, fallback: T[] = []) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function parseStructuredFees(formData: FormData) {
  const jsonFees = parseJsonArray<any>(formData.get("feesJson"));
  if (jsonFees.length) {
    return jsonFees
      .map((fee) => {
        const classLevel = Number(fee.classLevel || 0) || undefined;
        return {
          classLevel,
          label: fee.label || (classLevel ? getClassLabel(classLevel) : ""),
          sageStudentFee: Number(fee.sageStudentFee || 0),
          outsideStudentFee: Number(fee.outsideStudentFee || 0),
        };
      })
      .filter((fee) => fee.label);
  }
  return parseFees(formData.get("fees"));
}

export function parseRoutine(formData: FormData) {
  return parseJsonArray<any>(formData.get("routineJson"))
    .map((entry) => ({
      day: String(entry.day || "").trim(),
      time: String(entry.time || "").trim(),
      subject: String(entry.subject || "").trim(),
    }))
    .filter((entry) => entry.day && entry.time && entry.subject);
}

export function assessmentPayloadFromForm(formData: FormData): CreateModelTestInput | CreateExamInput {
  return {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    image: String(formData.get("image") ?? ""),
    classLevels: parseClassLevels(formData.get("classLevels")),
    version: (String(formData.get("version") || "both") as any),
    subjects: parseCsvList(formData.get("subjects")),
    schoolFocus: parseCsvList(formData.get("schoolFocus")),
    startDate: new Date(String(formData.get("startDate") ?? "")),
    endDate: new Date(String(formData.get("endDate") ?? "")),
    routineTitle: String(formData.get("routineTitle") ?? ""),
    routineSubtitle: String(formData.get("routineSubtitle") ?? ""),
    scheduleNote: String(formData.get("scheduleNote") ?? ""),
    fees: parseStructuredFees(formData),
    routine: parseRoutine(formData),
    features: parseCsvList(formData.get("features")),
    status: (String(formData.get("status") || "draft") as any),
    featured: formData.get("featured") === "on",
    order: Number(formData.get("order") || 0),
    ...(formData.has("examType") ? { examType: String(formData.get("examType") || "Regular Exam") as any } : {}),
  };
}

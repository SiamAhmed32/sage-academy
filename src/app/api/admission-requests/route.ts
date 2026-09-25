import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { boundedAdminSearch, escapeAdminRegex } from "@/lib/admin-query";
import { connectDB } from "@/lib/mongodb";
import { requireRole, staffRoles } from "@/lib/rbac";
import AdmissionRequest from "@/models/AdmissionRequest";
import { createAdmissionRequestSchema } from "@/schemas/admission-request";
import AcademicBatch from "@/models/AcademicBatch";
import Student from "@/models/Student";
import { buildStudentId, getNextStudentSerial } from "@/lib/student-id";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(staffRoles);
  await connectDB();

  const { searchParams } = new URL(req.url);
  const formOnly = searchParams.get("formOnly") === "true";

  if (formOnly) {
    const q = boundedAdminSearch(searchParams.get("q") || "");
    const requestedLimit = Number(searchParams.get("limit") || 20);
    const limit = Number.isSafeInteger(requestedLimit)
      ? Math.min(20, Math.max(1, requestedLimit))
      : 20;
    const safeSearch = q ? new RegExp(escapeAdminRegex(q), "i") : null;

    const leads = await AdmissionRequest.find({
      studentName: { $ne: "" },
      ...(safeSearch
        ? {
            $or: [
              { studentName: safeSearch },
              { nameBangla: safeSearch },
              { phone: safeSearch },
              { studentWhatsapp: safeSearch },
            ],
          }
        : {}),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        "_id studentName nameBangla phone studentWhatsapp studentGender academicVersion " +
        "fatherName motherName guardianName section classRoll schoolName " +
        "presentAddress permanentAddress className createdAt"
      );
    return successResponse(leads, "Form-only leads fetched successfully");
  }

  const requests = await AdmissionRequest.find().sort({ createdAt: -1 }).limit(100);
  return successResponse(requests, "Admission requests fetched successfully");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await connectDB();

  let body: unknown;
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    body = {
      studentName: readFormValue(formData, "studentName"),
      nameBangla: readFormValue(formData, "nameBangla"),
      guardianName: readFormValue(formData, "guardianName"),
      fatherName: readFormValue(formData, "fatherName"),
      motherName: readFormValue(formData, "motherName"),
      phone: readFormValue(formData, "phone"),
      studentWhatsapp: readFormValue(formData, "studentWhatsapp"),
      email: readFormValue(formData, "email"),
      className: readFormValue(formData, "className"),
      schoolName: readFormValue(formData, "schoolName"),
      section: readFormValue(formData, "section"),
      classRoll: readFormValue(formData, "classRoll"),
      studentDateOfBirth: readFormValue(formData, "studentDateOfBirth"),
      studentGender: readFormValue(formData, "studentGender"),
      preferredBatch: readFormValue(formData, "preferredBatch"),
      academicVersion: readFormValue(formData, "academicVersion") || "bangla",
      interestedSubjects: readFormValue(formData, "interestedSubjects"),
      admissionDate: readFormValue(formData, "admissionDate"),
      presentAddress: readFormValue(formData, "presentAddress"),
      permanentAddress: readFormValue(formData, "permanentAddress"),
      message: readFormValue(formData, "message"),
      source: readFormValue(formData, "source") || "admission-page",
      utmSource: readFormValue(formData, "utmSource"),
      utmMedium: readFormValue(formData, "utmMedium"),
      utmCampaign: readFormValue(formData, "utmCampaign"),
      utmContent: readFormValue(formData, "utmContent"),
      utmTerm: readFormValue(formData, "utmTerm"),
      attributionReferrer: readFormValue(formData, "attributionReferrer"),
      attributionLandingPath: readFormValue(formData, "attributionLandingPath"),
      attributionSubmitPath: readFormValue(formData, "attributionSubmitPath"),
      attributionCapturedAt: readFormValue(formData, "attributionCapturedAt"),
    };
  } else {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  const validatedData = createAdmissionRequestSchema.parse(body);
  const batch = validatedData.preferredBatch
    ? await AcademicBatch.findById(validatedData.preferredBatch).lean<{
        _id: string;
        title: string;
        classLevel: number;
        subjects?: Array<{ subjectName?: string; monthlyFee?: number }>;
      }>()
    : null;

  if (batch) {
    validatedData.preferredBatch = batch.title;
    const subjectNames = validatedData.interestedSubjects
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    const gender = ["male", "female", "other"].includes(validatedData.studentGender)
      ? validatedData.studentGender
      : "other";
    const version = ["bangla", "english", "other"].includes(validatedData.academicVersion)
      ? validatedData.academicVersion
      : "bangla";
    const admissionYear = new Date().getFullYear();
    const serialNumber = await getNextStudentSerial(admissionYear, batch.classLevel);

    await Student.create({
      studentId: buildStudentId(admissionYear, batch.classLevel, serialNumber),
      admissionYear,
      classLevel: batch.classLevel,
      serialNumber,
      nameEnglish: validatedData.studentName,
      nameBangla: validatedData.nameBangla,
      phone: validatedData.phone,
      whatsapp: validatedData.studentWhatsapp,
      fatherName: validatedData.fatherName,
      motherName: validatedData.motherName,
      guardianName: validatedData.guardianName,
      guardianPhone: validatedData.phone,
      gender,
      version,
      batch: batch._id,
      schoolName: validatedData.schoolName,
      section: validatedData.section,
      roll: validatedData.classRoll,
      presentAddress: validatedData.presentAddress,
      permanentAddress: validatedData.permanentAddress,
      admissionDate: validatedData.admissionDate || new Date(),
      dateOfBirth: validatedData.studentDateOfBirth,
      selectedSubjects: subjectNames.map((subjectName) => ({
        subjectName,
        baseFee: 0,
        discountType: "none",
        discountValue: 0,
        monthlyFee: 0,
      })),
      isActive: true,
    });
  }

  const request = await AdmissionRequest.create(validatedData);

  return successResponse(request, "Admission request submitted successfully", 201);
});

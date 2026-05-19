import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { uploadAdmissionFormFile } from "@/lib/upload-file";
import AdmissionRequest from "@/models/AdmissionRequest";
import { createAdmissionRequestSchema } from "@/schemas/admission-request";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export const GET = withApiHandler(async (req: NextRequest) => {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const formOnly = searchParams.get("formOnly") === "true";

  if (formOnly) {
    // Return only text-form submissions (no uploaded PDF) with fields needed for student pre-fill
    const leads = await AdmissionRequest.find({
      $or: [
        { "uploadedForm": null },
        { "uploadedForm": { $exists: false } },
        { "uploadedForm.url": "" },
        { "uploadedForm.url": { $exists: false } },
      ],
      studentName: { $ne: "" },
    })
      .sort({ createdAt: -1 })
      .limit(200)
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

  let body: any;
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("uploadedForm");
    
    const uploadedForm =
      file instanceof File && file.size > 0
        ? await uploadAdmissionFormFile(file)
        : null;

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
      uploadedForm,
    };
  } else {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  const validatedData = createAdmissionRequestSchema.parse(body);
  const request = await AdmissionRequest.create(validatedData);

  return successResponse(request, "Admission request submitted successfully", 201);
});

import mongoose from "mongoose";
import { ZodError } from "zod";

import { BadRequestError, NotFoundError, ValidationError } from "@/lib/errors";
import type { AdmissionRequestUpdatePayload } from "@/schemas/admission-request";

export function resolveAdmissionRequestId(id: string): string {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid admission request id");
  }

  return id;
}

export function assertAdmissionRequestFound<T>(doc: T | null): T {
  if (!doc) throw new NotFoundError("Admission request not found");
  return doc;
}

export function throwAdmissionRequestValidation(error: ZodError): never {
  const message = error.issues[0]?.message ?? "Validation failed";
  throw new ValidationError(message);
}

export function buildAdmissionRequestUpdate(
  body: AdmissionRequestUpdatePayload
): AdmissionRequestUpdatePayload {
  const update: AdmissionRequestUpdatePayload = {};

  if (body.studentName !== undefined) update.studentName = body.studentName.trim();
  if (body.nameBangla !== undefined) update.nameBangla = body.nameBangla.trim();
  if (body.guardianName !== undefined) update.guardianName = body.guardianName.trim();
  if (body.fatherName !== undefined) update.fatherName = body.fatherName.trim();
  if (body.motherName !== undefined) update.motherName = body.motherName.trim();
  if (body.phone !== undefined) update.phone = body.phone.trim();
  if (body.studentWhatsapp !== undefined) update.studentWhatsapp = body.studentWhatsapp.trim();
  if (body.email !== undefined) update.email = body.email.trim();
  if (body.className !== undefined) update.className = body.className.trim();
  if (body.schoolName !== undefined) update.schoolName = body.schoolName.trim();
  if (body.section !== undefined) update.section = body.section.trim();
  if (body.classRoll !== undefined) update.classRoll = body.classRoll.trim();
  if (body.studentDateOfBirth !== undefined) update.studentDateOfBirth = body.studentDateOfBirth;
  if (body.studentGender !== undefined) update.studentGender = body.studentGender;
  if (body.preferredBatch !== undefined) update.preferredBatch = body.preferredBatch.trim();
  if (body.academicVersion !== undefined) update.academicVersion = body.academicVersion;
  if (body.interestedSubjects !== undefined) update.interestedSubjects = body.interestedSubjects.trim();
  if (body.admissionDate !== undefined) update.admissionDate = body.admissionDate;
  if (body.presentAddress !== undefined) update.presentAddress = body.presentAddress.trim();
  if (body.permanentAddress !== undefined) update.permanentAddress = body.permanentAddress.trim();
  if (body.message !== undefined) update.message = body.message.trim();
  if (body.source !== undefined) update.source = body.source.trim();
  if (body.status !== undefined) update.status = body.status;
  if (body.isRead !== undefined) update.isRead = body.isRead;
  if (body.adminNote !== undefined) update.adminNote = body.adminNote.trim();
  if (body.uploadedForm !== undefined) update.uploadedForm = body.uploadedForm;

  return update;
}

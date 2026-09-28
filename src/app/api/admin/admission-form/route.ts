import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { Types } from "mongoose";

import type { AdmissionPrefill } from "@/components/admin/academy/AdmissionWizard";
import { listBatchOptions, listClassOptions } from "@/lib/academy/queries";
import { AppError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { requireRole, staffRoles } from "@/lib/rbac";
import AdmissionRequest from "@/models/AdmissionRequest";

export const dynamic = "force-dynamic";

const loadLists = unstable_cache(
  async () => {
    const [classes, batches] = await Promise.all([listClassOptions(), listBatchOptions()]);
    return { classes, batches };
  },
  ["admin-admission-lists"],
  { revalidate: 20 }
);

async function loadPrefill(id: string | undefined): Promise<AdmissionPrefill | null> {
  if (!id || !Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const request = await AdmissionRequest.findById(id)
    .select("studentName nameBangla studentGender guardianName phone studentWhatsapp fatherName motherName schoolName presentAddress studentDateOfBirth academicVersion className")
    .lean<{
      _id: unknown;
      studentName?: string;
      nameBangla?: string;
      studentGender?: string;
      guardianName?: string;
      phone?: string;
      studentWhatsapp?: string;
      fatherName?: string;
      motherName?: string;
      schoolName?: string;
      presentAddress?: string;
      studentDateOfBirth?: Date | null;
      academicVersion?: string;
      className?: string;
    }>();
  if (!request) return null;
  const level = Number(String(request.className ?? "").match(/\d+/)?.[0]);
  const dob = request.studentDateOfBirth ? new Date(request.studentDateOfBirth) : null;
  return {
    requestId: String(request._id),
    name: request.studentName ?? "",
    nameBangla: request.nameBangla ?? "",
    gender: request.studentGender === "male" || request.studentGender === "female" ? request.studentGender : "",
    guardianName: request.guardianName ?? "",
    guardianPhone: request.phone ?? "",
    whatsapp: request.studentWhatsapp ?? "",
    fatherName: request.fatherName ?? "",
    motherName: request.motherName ?? "",
    schoolName: request.schoolName ?? "",
    address: request.presentAddress ?? "",
    dateOfBirth: dob && !Number.isNaN(dob.getTime()) ? dob.toISOString().slice(0, 10) : "",
    version: request.academicVersion === "english" || request.academicVersion === "bangla" ? request.academicVersion : "",
    classLevel: Number.isFinite(level) && level >= 1 && level <= 12 ? level : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(staffRoles);
    const requestId = request.nextUrl.searchParams.get("request") ?? undefined;
    const [lists, prefill] = await Promise.all([loadLists(), loadPrefill(requestId)]);
    return NextResponse.json({ ...lists, prefill });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    console.error("[admin-admission-form]", error);
    return NextResponse.json({ message: "Could not load the admission form." }, { status: 500 });
  }
}

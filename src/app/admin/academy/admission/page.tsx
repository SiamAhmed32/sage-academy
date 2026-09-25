import Link from "next/link";
import { Types } from "mongoose";
import { Inbox, ListChecks } from "lucide-react";

import { AdmissionWizard, type AdmissionPrefill } from "@/components/admin/academy/AdmissionWizard";
import { EmptyState, PageHeading } from "@/components/admin/sa/ui";
import { listBatchOptions, listClassOptions } from "@/lib/academy/queries";
import { connectDB } from "@/lib/mongodb";
import AdmissionRequest from "@/models/AdmissionRequest";

type RequestDoc = {
  _id: Types.ObjectId;
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
};

async function loadPrefill(id: string | undefined): Promise<AdmissionPrefill | null> {
  if (!id || !Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const request = await AdmissionRequest.findById(id).lean<RequestDoc>();
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

export default async function AdmissionPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; request?: string }>;
}) {
  const params = await searchParams;
  const [classes, batches, prefill] = await Promise.all([listClassOptions(), listBatchOptions(), loadPrefill(params.request)]);

  return (
    <div>
      <PageHeading
        eyebrow="Students"
        title="New admission"
        description="Enter the student, choose a batch that matches their class, gender and version, pick subjects and discounts, then collect the first payment."
        actions={
          <Link href="/admin/admissions" className="btn-secondary">
            <Inbox size={17} /> Admission requests
          </Link>
        }
      />
      {batches.length === 0 ? (
        <section className="panel">
          <EmptyState
            icon={ListChecks}
            title="Create a batch first"
            description="Students are admitted into a batch. Set up classes, subjects and at least one batch."
            action={
              <Link href="/admin/academy/batches/new" className="btn-primary">
                Create batch
              </Link>
            }
          />
        </section>
      ) : (
        <AdmissionWizard classes={classes} batches={batches} initialBatchId={params.batch ?? ""} prefill={prefill} />
      )}
    </div>
  );
}

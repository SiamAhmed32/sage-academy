import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import {
  resolveEnrollmentCustomerEmail,
  sendExamEnrollmentApprovedEmail,
  sendExamEnrollmentRejectedEmail,
} from "@/lib/exam-hub-enrollment-mail";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import ExamEnrollment from "@/models/ExamEnrollment";
import ExamProgram from "@/models/ExamProgram";
import { verifyEnrollmentSchema } from "@/schemas/exam-hub";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { id } = await context.params;

  const enrollment = await ExamEnrollment.findById(id).lean();
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  const program = await ExamProgram.findById(enrollment.programId).select("title slug feeAmount deliveryMode").lean();

  return successResponse(
    {
      ...enrollment,
      _id: String(enrollment._id),
      programId: String(enrollment.programId),
      programTitle: program?.title || "",
      programSlug: program?.slug || "",
      programFeeAmount: program?.feeAmount || 0,
    },
    "Enrollment fetched"
  );
});

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const user = await requireRole(adminRoles);
  await connectDB();
  const { id } = await context.params;
  const body = verifyEnrollmentSchema.parse(await req.json());

  const update: Record<string, unknown> = {
    status: body.status,
    adminNote: body.adminNote || "",
    verifiedBy: user.id,
    verifiedAt: new Date(),
  };

  if (body.paymentStatus) {
    update.paymentStatus = body.paymentStatus;
  } else if (body.status === "confirmed") {
    update.paymentStatus = "verified";
  }

  const enrollment = await ExamEnrollment.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  const program = await ExamProgram.findById(enrollment.programId).select("title slug feeAmount").lean();
  if (!program) throw new NotFoundError("Program not found");

  const mailContext = {
    name: enrollment.name,
    phone: enrollment.phone,
    email: enrollment.email,
    classLabel: enrollment.classLabel,
    schoolName: enrollment.schoolName,
    message: enrollment.message,
    programTitle: program.title,
    programSlug: program.slug,
    feeAmount: enrollment.feeAmount || program.feeAmount,
    transactionId: enrollment.transactionId,
    paymentStatus: enrollment.paymentStatus,
    paymentProofUrl: enrollment.paymentProof?.previewUrl || enrollment.paymentProof?.url || "",
  };

  const customerEmail = await resolveEnrollmentCustomerEmail(enrollment);
  let emailSent = false;
  let emailError: string | null = null;

  if (customerEmail) {
    try {
      if (body.status === "confirmed") {
        await sendExamEnrollmentApprovedEmail(customerEmail, mailContext);
        emailSent = true;
      } else if (body.paymentStatus === "rejected") {
        await sendExamEnrollmentRejectedEmail(customerEmail, mailContext, body.adminNote || "");
        emailSent = true;
      }
    } catch (error) {
      console.error("[exam-hub] Enrollment status email failed:", error);
      emailError = "Enrollment updated but email could not be sent";
    }
  } else if (body.status === "confirmed" || body.paymentStatus === "rejected") {
    emailError = "Enrollment updated but no customer email was found";
  }

  return successResponse(
    {
      ...enrollment,
      _id: String(enrollment._id),
      emailSent,
      emailWarning: emailError,
    },
    emailError
      ? emailError
      : body.status === "confirmed"
        ? "Enrollment approved"
        : "Enrollment rejected"
  );
});

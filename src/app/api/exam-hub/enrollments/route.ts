import { NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import {
  programRequiresPayment,
  sanitizePhone,
  serializeEnrollmentStatus,
  serializePublicProgram,
  enrollmentBlocksNewRequest,
} from "@/lib/exam-hub";
import { getClientMeta } from "@/lib/exam-hub-auth";
import {
  resolveEnrollmentCustomerEmail,
  sendExamEnrollmentAdminNotification,
  sendExamEnrollmentConfirmedEmail,
} from "@/lib/exam-hub-enrollment-mail";
import { assertRateLimit, buildRateLimitKey } from "@/lib/rate-limit";
import { uploadPaymentProof } from "@/lib/upload-payment-proof";
import { connectDB } from "@/lib/mongodb";
import ExamEnrollment from "@/models/ExamEnrollment";
import ExamProgram from "@/models/ExamProgram";
import { offlineEnrollmentSchema, onlineEnrollmentSchema } from "@/schemas/exam-hub";
import { z } from "zod";

export const POST = withApiHandler(async (req: NextRequest) => {
  assertRateLimit(buildRateLimitKey("exam-hub:enroll", req), 6, 15 * 60_000);
  await connectDB();
  const contentType = req.headers.get("content-type") || "";
  const meta = getClientMeta(req);

  let body: Record<string, unknown> = {};
  let proofFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    body = Object.fromEntries(formData.entries());
    const file = formData.get("paymentProof");
    proofFile = file instanceof File && file.size > 0 ? file : null;
  } else {
    body = await req.json();
  }

  const program = await ExamProgram.findOne({ slug: String(body.programSlug || ""), status: "published" }).lean();
  if (!program) throw new NotFoundError("Exam not found");

  const requiresPayment = programRequiresPayment(program as { deliveryMode: string; isPaid?: boolean; accessType?: string });
  const parsed = requiresPayment
    ? onlineEnrollmentSchema.parse(body)
    : offlineEnrollmentSchema.parse(body);

  const phone = sanitizePhone(parsed.phone);
  const feeAmount = requiresPayment ? Number((program as { feeAmount?: number }).feeAmount || 0) : 0;

  const existing = await ExamEnrollment.findOne({
    programId: program._id,
    phone,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (existing && enrollmentBlocksNewRequest(existing)) {
    const status = serializeEnrollmentStatus(existing);
    return NextResponse.json(
      {
        success: false,
        message:
          existing.status === "pending" || existing.paymentStatus === "submitted"
            ? "You already submitted a registration request for this exam. Please wait for approval."
            : "You are already registered for this exam.",
        code: "DUPLICATE_ENROLLMENT",
        data: status,
      },
      { status: 409 }
    );
  }

  if (requiresPayment && feeAmount > 0) {
    const paid = parsed as z.infer<typeof onlineEnrollmentSchema>;
    if (!paid.transactionId?.trim()) {
      throw new BadRequestError("bKash transaction ID is required");
    }
    if (!proofFile) {
      throw new BadRequestError("Payment screenshot is required");
    }
  }

  const paymentProof = proofFile ? await uploadPaymentProof(proofFile) : null;

  const enrollment = await ExamEnrollment.create({
    programId: program._id,
    name: parsed.name.trim(),
    phone,
    email: parsed.email?.trim().toLowerCase() || "",
    classLabel: parsed.classLabel.trim(),
    schoolName: parsed.schoolName?.trim() || "",
    message: parsed.message?.trim() || "",
    feeAmount,
    paymentStatus: requiresPayment && feeAmount > 0 ? "submitted" : "not_required",
    paymentMethod: requiresPayment && feeAmount > 0 ? "bkash" : null,
    transactionId:
      requiresPayment && feeAmount > 0
        ? (parsed as z.infer<typeof onlineEnrollmentSchema>).transactionId?.trim() || ""
        : "",
    paymentProof,
    status:
      program.deliveryMode === "offline" || !requiresPayment || feeAmount === 0
        ? "confirmed"
        : "pending",
    ...meta,
  });

  const mailContext = {
    name: enrollment.name,
    phone: enrollment.phone,
    email: enrollment.email,
    classLabel: enrollment.classLabel,
    schoolName: enrollment.schoolName,
    message: enrollment.message,
    programTitle: program.title,
    programSlug: program.slug,
    feeAmount: enrollment.feeAmount,
    transactionId: enrollment.transactionId,
    paymentStatus: enrollment.paymentStatus,
    paymentProofUrl: paymentProof?.previewUrl || paymentProof?.url || "",
  };

  try {
    await sendExamEnrollmentAdminNotification(mailContext);
  } catch (error) {
    console.error("[exam-hub] Admin enrollment notification failed:", error);
  }

  if (enrollment.status === "confirmed") {
    try {
      const customerEmail = await resolveEnrollmentCustomerEmail(enrollment);
      if (customerEmail) {
        await sendExamEnrollmentConfirmedEmail(customerEmail, mailContext);
      }
    } catch (error) {
      console.error("[exam-hub] Customer confirmation email failed:", error);
    }
  }

  return successResponse(
    {
      enrollmentId: enrollment._id.toString(),
      status: enrollment.status,
      paymentStatus: enrollment.paymentStatus,
      program: serializePublicProgram(program as Record<string, unknown>),
    },
    program.deliveryMode === "offline"
      ? "Offline exam registration submitted"
      : requiresPayment
        ? "Enrollment submitted — payment pending verification"
        : "Enrollment confirmed — you can start the exam",
    201
  );
});

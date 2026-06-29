import { sendEmail } from "@/lib/email";
import { sanitizePhone } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

type EnrollmentMailContext = {
  name: string;
  phone: string;
  email?: string;
  classLabel: string;
  schoolName?: string;
  message?: string;
  programTitle: string;
  programSlug?: string;
  feeAmount?: number;
  transactionId?: string;
  paymentStatus?: string;
  paymentProofUrl?: string;
};

function appName() {
  return process.env.APP_NAME || "SAGE Academy";
}

export function getExamHubNotifyEmail() {
  return process.env.EXAM_HUB_NOTIFY_EMAIL || process.env.GMAIL || "sageacademybd@gmail.com";
}

function wrapEmail(title: string, body: string) {
  return `
    <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #6D0F12; margin: 0 0 16px;">${title}</h2>
      ${body}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;">
      <p style="font-size: 12px; color: #999; margin: 0;">${appName()} · Banasree, Dhaka</p>
    </div>
  `;
}

function detailRows(ctx: EnrollmentMailContext) {
  const rows = [
    ["Student", ctx.name],
    ["Phone", ctx.phone],
    ["Class", ctx.classLabel],
    ["Exam", ctx.programTitle],
    ctx.schoolName ? ["School", ctx.schoolName] : null,
    ctx.feeAmount ? ["Fee", `৳${ctx.feeAmount}`] : null,
    ctx.transactionId ? ["Transaction ID", ctx.transactionId] : null,
    ctx.paymentStatus ? ["Payment status", ctx.paymentStatus] : null,
    ctx.message ? ["Message", ctx.message] : null,
  ].filter(Boolean) as [string, string][];

  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#666;vertical-align:top;width:140px;">${label}</td><td style="padding:8px 0;font-weight:600;color:#1f2937;">${value}</td></tr>`
    )
    .join("");
}

export async function resolveEnrollmentCustomerEmail(input: { email?: string; phone: string }) {
  if (input.email?.trim()) return input.email.trim().toLowerCase();

  await connectDB();
  const user = await User.findOne({ phone: sanitizePhone(input.phone) }).select("email").lean();
  return user?.email?.trim().toLowerCase() || null;
}

export async function sendExamEnrollmentAdminNotification(ctx: EnrollmentMailContext) {
  const adminEmail = getExamHubNotifyEmail();
  const proofBlock = ctx.paymentProofUrl
    ? `<p style="margin-top:16px;"><a href="${ctx.paymentProofUrl}" style="color:#6D0F12;">View payment screenshot</a></p>`
    : "";

  await sendEmail({
    to: adminEmail,
    subject: `New exam enrollment — ${ctx.programTitle}`,
    html: wrapEmail(
      "New exam enrollment request",
      `<p style="color:#444;line-height:1.6;">A student submitted an enrollment request. Review it in the admin Exam Hub.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">${detailRows(ctx)}</table>
      ${proofBlock}
      <p style="margin-top:20px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/exam-hub" style="background:#6D0F12;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Open Exam Hub</a></p>`
    ),
  });
}

export async function sendExamEnrollmentApprovedEmail(
  to: string,
  ctx: EnrollmentMailContext & { programSlug: string }
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await sendEmail({
    to,
    subject: `Enrollment approved — ${ctx.programTitle}`,
    html: wrapEmail(
      "Your exam enrollment is approved",
      `<p style="color:#444;line-height:1.6;">Dear ${ctx.name},</p>
      <p style="color:#444;line-height:1.6;">Your enrollment for <strong>${ctx.programTitle}</strong> has been verified. You can now start the exam from the exam page.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">${detailRows(ctx)}</table>
      <p style="margin-top:20px;"><a href="${siteUrl}/exams/${ctx.programSlug}" style="background:#6D0F12;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Go to exam</a></p>`
    ),
  });
}

export async function sendExamEnrollmentRejectedEmail(
  to: string,
  ctx: EnrollmentMailContext,
  adminNote: string
) {
  await sendEmail({
    to,
    subject: `Enrollment update — ${ctx.programTitle}`,
    html: wrapEmail(
      "Enrollment could not be approved",
      `<p style="color:#444;line-height:1.6;">Dear ${ctx.name},</p>
      <p style="color:#444;line-height:1.6;">We could not approve your enrollment for <strong>${ctx.programTitle}</strong>.</p>
      <div style="margin:16px 0;padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#991b1b;">
        <strong>Message from admin:</strong><br>${adminNote.replace(/\n/g, "<br>")}
      </div>
      <p style="color:#444;line-height:1.6;">If you believe this is a mistake, please contact ${appName()} with your phone number and transaction details.</p>`
    ),
  });
}

export async function sendExamEnrollmentConfirmedEmail(
  to: string,
  ctx: EnrollmentMailContext & { programSlug: string }
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await sendEmail({
    to,
    subject: `Registration confirmed — ${ctx.programTitle}`,
    html: wrapEmail(
      "Exam registration confirmed",
      `<p style="color:#444;line-height:1.6;">Dear ${ctx.name},</p>
      <p style="color:#444;line-height:1.6;">Your registration for <strong>${ctx.programTitle}</strong> is confirmed.</p>
      <p style="margin-top:20px;"><a href="${siteUrl}/exams/${ctx.programSlug}" style="background:#6D0F12;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Open exam page</a></p>`
    ),
  });
}

import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { assessmentModel, assessmentModelName } from "@/lib/assessments";
import { connectDB } from "@/lib/mongodb";
import { staffRoles, requireRole } from "@/lib/rbac";
import AssessmentRegistration from "@/models/AssessmentRegistration";
import { assessmentRegistrationSchema } from "@/schemas/assessment";

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 45) ?? req.headers.get("x-real-ip")?.slice(0, 45) ?? "";
}

export const GET = withApiHandler(async () => {
  await requireRole(staffRoles);
  await connectDB();
  const items = await AssessmentRegistration.find().sort({ createdAt: -1 }).limit(500).lean();
  return successResponse(items, "Registrations fetched");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const parsed = assessmentRegistrationSchema.parse(body);
  const model = assessmentModel(parsed.assessmentKind);
  const assessment = await model.findOne({
    _id: parsed.assessmentId,
    status: "published",
    endDate: { $gte: new Date() },
  }).lean();
  if (!assessment) throw new NotFoundError("এই পরীক্ষা/মডেল টেস্টটি এখন আর চালু নেই।");

  const duplicate = await AssessmentRegistration.findOne({
    phone: parsed.phone,
    assessmentKind: parsed.assessmentKind,
    assessmentId: parsed.assessmentId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  }).lean();
  if (duplicate) throw new BadRequestError("এই নম্বর দিয়ে গত ২৪ ঘণ্টায় রেজিস্ট্রেশন করা হয়েছে।");

  const created = await AssessmentRegistration.create({
    ...parsed,
    assessmentModel: assessmentModelName(parsed.assessmentKind),
    assessmentTitle: (assessment as any).title,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? "",
  });

  return successResponse(created, "Registration submitted", 201);
});

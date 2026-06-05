import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { buildAssessmentRegistrationFilter } from "@/lib/admin-assessment-registration-query";
import { assessmentModel, assessmentModelName } from "@/lib/assessments";
import { connectDB } from "@/lib/mongodb";
import { staffRoles, requireRole } from "@/lib/rbac";
import AssessmentRegistration from "@/models/AssessmentRegistration";
import { assessmentRegistrationSchema } from "@/schemas/assessment";

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 45) ?? req.headers.get("x-real-ip")?.slice(0, 45) ?? "";
}

type AssessmentLeadSource = {
  title?: string;
  examType?: string;
};

function searchParam(req: NextRequest, key: string, fallback = "all") {
  return req.nextUrl.searchParams.get(key)?.trim() || fallback;
}

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(staffRoles);
  await connectDB();
  const limit = Math.min(100, Math.max(1, Number(searchParam(req, "limit", "50")) || 50));
  const page = Math.max(1, Number(searchParam(req, "page", "1")) || 1);
  const sort = searchParam(req, "sort", "desc");
  const query = buildAssessmentRegistrationFilter({
    q: searchParam(req, "q", ""),
    status: searchParam(req, "status"),
    assessmentKind: searchParam(req, "assessmentKind"),
    assessmentType: searchParam(req, "assessmentType"),
    classLabel: searchParam(req, "classLabel"),
    applicantType: searchParam(req, "applicantType"),
    dateRange: searchParam(req, "dateRange"),
  });

  const [items, total] = await Promise.all([
    AssessmentRegistration.find(query)
      .sort({ createdAt: sort === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AssessmentRegistration.countDocuments(query),
  ]);
  return successResponse({ items, total, page, limit }, "Registrations fetched");
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
  }).lean<AssessmentLeadSource | null>();
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
    assessmentTitle: assessment.title || "",
    assessmentType: parsed.assessmentKind === "modelTest" ? "Model Test" : assessment.examType || "Exam",
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? "",
  });

  return successResponse(created, "Registration submitted", 201);
});

import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { assessmentPayloadFromForm, slugifyAssessment } from "@/lib/assessments";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import { uploadAssessmentImage } from "@/lib/upload-assessment-image";
import Exam from "@/models/Exam";
import { createExamSchema } from "@/schemas/assessment";

export const GET = withApiHandler(async () => {
  await requireRole(adminRoles);
  await connectDB();
  const items = await Exam.find().sort({ order: 1, createdAt: -1 }).lean();
  return successResponse(items, "Exams fetched");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();
  const formData = await req.formData();
  const parsed = createExamSchema.parse(assessmentPayloadFromForm(formData));
  const imageFile = formData.get("imageFile");
  const image = imageFile instanceof File && imageFile.size > 0 ? await uploadAssessmentImage(imageFile) : parsed.image;
  const slug = parsed.slug?.trim() || `${slugifyAssessment(parsed.title)}-${Date.now()}`;
  const item = await Exam.create({ ...parsed, image, slug: slugifyAssessment(slug) });
  return successResponse(item, "Exam created", 201);
});

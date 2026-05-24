import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { assessmentPayloadFromForm, slugifyAssessment } from "@/lib/assessments";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import { uploadAssessmentImage } from "@/lib/upload-assessment-image";
import ModelTest from "@/models/ModelTest";
import { updateModelTestSchema } from "@/schemas/assessment";

type RouteContext = { params: Promise<Record<string, string>> };

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { id } = await context.params;
  const formData = await req.formData();
  const existing = await ModelTest.findById(id);
  if (!existing) throw new NotFoundError("Model test not found");
  const parsed = updateModelTestSchema.parse(assessmentPayloadFromForm(formData));
  if (!parsed.slug) delete parsed.slug;
  const imageFile = formData.get("imageFile");
  const image = imageFile instanceof File && imageFile.size > 0 ? await uploadAssessmentImage(imageFile) : parsed.image ?? existing.image ?? "";
  const update: Record<string, unknown> = {
    ...parsed,
    image,
    archivedAt: parsed.status === "archived" ? new Date() : null,
  };
  if (parsed.slug) update.slug = slugifyAssessment(parsed.slug);
  const item = await ModelTest.findByIdAndUpdate(id, update, { new: true });
  if (!item) throw new NotFoundError("Model test not found");
  return successResponse(item, "Model test updated");
});

export const DELETE = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  await connectDB();
  const { id } = await context.params;
  const permanent = new URL(req.url).searchParams.get("permanent") === "true";
  const item = permanent
    ? await ModelTest.findByIdAndDelete(id)
    : await ModelTest.findByIdAndUpdate(id, { status: "archived", archivedAt: new Date(), featured: false }, { new: true });
  if (!item) throw new NotFoundError("Model test not found");
  return successResponse(item, permanent ? "Model test deleted" : "Model test archived");
});

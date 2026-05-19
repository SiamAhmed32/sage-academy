// Force rebuild to clear stale slugify error
import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import PromotionCard from "@/models/PromotionCard";
import { uploadBatchImage } from "@/lib/upload-batch-image";
function simpleSlugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with -
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing -
}

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  await connectDB();

  const formData = await req.formData();
  const card = await PromotionCard.findById(id);
  if (!card) throw new NotFoundError("Promotion card not found");

  const title = formData.get("title") as string;
  const badge = formData.get("badge") as string;
  const order = Number(formData.get("order") || 0);
  const websiteVisible = formData.get("websiteVisible") === "on";
  const featured = formData.get("featured") === "on";
  const linkedBatch = formData.get("linkedBatch") || null;

  const features = [
    formData.get("feature1"),
    formData.get("feature2"),
    formData.get("feature3"),
    formData.get("feature4"),
    formData.get("feature5"),
  ].filter((f): f is string => typeof f === "string" && f.length > 0);

  let imageUrl = card.image;
  const imageFile = formData.get("imageFile") as File;
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadBatchImage(imageFile);
  }

  const updateData: any = {
    title,
    badge,
    order,
    websiteVisible,
    featured,
    linkedBatch,
    features,
    overview: (formData.get("overview") as string)?.trim() || "",
    image: imageUrl,
  };

  if (title !== card.title) {
    updateData.slug = simpleSlugify(title);
  }

  const updatedCard = await PromotionCard.findByIdAndUpdate(id, updateData, { new: true });

  return successResponse(updatedCard, "Promotion card updated successfully");
});

export const DELETE = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  const permanent = new URL(req.url).searchParams.get("permanent") === "true";
  await connectDB();

  if (permanent) {
    const deleted = await PromotionCard.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundError("Promotion card not found");
    return successResponse(deleted, "Promotion card deleted permanently");
  }

  const archived = await PromotionCard.findByIdAndUpdate(
    id, 
    { 
      isArchived: true, 
      archivedAt: new Date(),
      websiteVisible: false,
      featured: false,
    }, 
    { new: true }
  );
  if (!archived) throw new NotFoundError("Promotion card not found");

  return successResponse(archived, "Promotion card archived successfully");
});

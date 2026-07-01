import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { buildPublicSlug } from "@/lib/public-slug";
import { adminRoles, requireRole } from "@/lib/rbac";
import { revalidatePromotionCardPublicPages } from "@/lib/revalidate-public";
import { uploadBatchImage } from "@/lib/upload-batch-image";
import AcademicBatch from "@/models/AcademicBatch";
import PromotionCard from "@/models/PromotionCard";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

function formHas(formData: FormData, key: string) {
  return formData.get(key) !== null;
}

function checkboxOn(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function parseArchivedValue(formData: FormData) {
  const value = formData.get("isArchived");
  if (value === null) return undefined;
  return value === "true" || value === "on";
}

export const PATCH = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await requireRole(adminRoles);
  const { id } = await context.params;
  await connectDB();

  const formData = await req.formData();
  const card = await PromotionCard.findById(id);
  if (!card) throw new NotFoundError("Promotion card not found");

  const nextArchived = parseArchivedValue(formData);
  const isStatusOnlyUpdate = nextArchived !== undefined && !formHas(formData, "title");

  if (isStatusOnlyUpdate) {
    const updateData: Record<string, unknown> = {
      isArchived: nextArchived,
      archivedAt: nextArchived ? new Date() : null,
    };

    if (formHas(formData, "websiteVisible")) {
      updateData.websiteVisible = checkboxOn(formData, "websiteVisible");
    } else if (!nextArchived) {
      updateData.websiteVisible = true;
    }

    if (formHas(formData, "featured")) {
      updateData.featured = checkboxOn(formData, "featured");
    }

    const updatedCard = await PromotionCard.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    revalidatePromotionCardPublicPages();
    revalidatePath("/admin/promotion-cards");
    revalidatePath("/admin/promotion_cards");

    return successResponse(updatedCard, "Promotion card status updated successfully");
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    throw new BadRequestError("Card title is required");
  }

  const badge = String(formData.get("badge") ?? card.badge ?? "ভর্তি চলছে").trim();
  const order = Number(formData.get("order") || card.order || 0);
  const websiteVisible = formHas(formData, "websiteVisible")
    ? checkboxOn(formData, "websiteVisible")
    : card.websiteVisible;
  const featured = formHas(formData, "featured")
    ? checkboxOn(formData, "featured")
    : card.featured;
  const linkedBatch = formData.get("linkedBatch")?.toString() || null;

  const features = [
    formData.get("feature1"),
    formData.get("feature2"),
    formData.get("feature3"),
    formData.get("feature4"),
    formData.get("feature5"),
  ].filter((feature): feature is string => typeof feature === "string" && feature.length > 0);

  if (features.length !== 5) {
    throw new BadRequestError("Promotion card must have exactly 5 features");
  }

  let imageUrl = card.image;
  const imageFile = formData.get("imageFile") as File;
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadBatchImage(imageFile);
  }

  const updateData: Record<string, unknown> = {
    title,
    badge,
    order,
    websiteVisible,
    featured,
    linkedBatch,
    features,
    overview: String(formData.get("overview") ?? card.overview ?? "").trim(),
    image: imageUrl,
  };

  if (nextArchived !== undefined) {
    updateData.isArchived = nextArchived;
    updateData.archivedAt = nextArchived ? new Date() : null;
  }

  if (title !== card.title || String(linkedBatch || "") !== String(card.linkedBatch || "")) {
    const batch = linkedBatch
      ? await AcademicBatch.findById(linkedBatch).select("batchCode classLevel").lean()
      : null;

    updateData.slug = buildPublicSlug({
      title,
      batchCode: batch?.batchCode,
      classLevel: batch?.classLevel,
      fallback: card.slug || `batch-${Date.now()}`,
    });
  }

  const updatedCard = await PromotionCard.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  revalidatePromotionCardPublicPages();
  revalidatePath("/admin/promotion-cards");
  revalidatePath("/admin/promotion_cards");

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

    revalidatePromotionCardPublicPages();
    revalidatePath("/admin/promotion-cards");
    revalidatePath("/admin/promotion_cards");

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

  revalidatePromotionCardPublicPages();
  revalidatePath("/admin/promotion-cards");
  revalidatePath("/admin/promotion_cards");

  return successResponse(archived, "Promotion card archived successfully");
});

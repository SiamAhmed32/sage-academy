import { buildPublicSlug } from "@/lib/public-slug";
import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";
import PromotionCard from "@/models/PromotionCard";
import "@/models/Teacher";

const linkedBatchPopulate = {
  path: "linkedBatch" as const,
  populate: {
    path: "subjects.teacher" as const,
    select: "name subject designation experience image quote socialLinks",
  },
};

const visibleCardQuery = {
  isArchived: { $ne: true },
  websiteVisible: true,
};

function getRequestedClassLevel(slug: string) {
  const match = slug.match(/^class-([4-9]|1[0-2])$/i);
  return match?.[1] ? Number(match[1]) : null;
}

export async function findPromotionCardBySlug(slug: string) {
  await connectDB();

  const normalizedSlug = slug.toLowerCase().trim();

  const exactByCardSlug = await PromotionCard.findOne({
    ...visibleCardQuery,
    slug: normalizedSlug,
  })
    .populate(linkedBatchPopulate)
    .lean();

  if (exactByCardSlug) {
    return exactByCardSlug;
  }

  const classLevel = getRequestedClassLevel(normalizedSlug);
  if (classLevel) {
    const batchIds = await AcademicBatch.find({
      classLevel,
      isArchived: { $ne: true },
    })
      .select("_id")
      .lean();

    if (batchIds.length > 0) {
      const byLinkedBatch = await PromotionCard.findOne({
        ...visibleCardQuery,
        linkedBatch: { $in: batchIds.map((batch) => batch._id) },
      })
        .sort({ order: 1, createdAt: -1 })
        .populate(linkedBatchPopulate)
        .lean();

      if (byLinkedBatch) {
        return byLinkedBatch;
      }
    }

    const classCards = await PromotionCard.find(visibleCardQuery)
      .select("title slug")
      .populate({
        path: "linkedBatch",
        select: "classLevel",
      })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const matched = classCards.find((card) => {
      const linkedClassLevel =
        card.linkedBatch && typeof card.linkedBatch === "object"
          ? card.linkedBatch.classLevel
          : null;

      return (
        buildPublicSlug({
          title: card.title,
          classLevel: linkedClassLevel,
          fallback: card.slug,
        }) === normalizedSlug
      );
    });

    if (matched) {
      return PromotionCard.findById(matched._id).populate(linkedBatchPopulate).lean();
    }
  }

  return null;
}

export async function findRelatedPromotionCards(excludeId: unknown, limit = 6) {
  await connectDB();

  return PromotionCard.find({
    _id: { $ne: excludeId },
    ...visibleCardQuery,
  })
    .sort({ order: 1, createdAt: 1 })
    .limit(limit)
    .select("title slug image badge linkedBatch")
    .populate({ path: "linkedBatch", select: "classLevel" })
    .lean();
}

import { unstable_cache } from "next/cache";

import { connectDB } from "@/lib/mongodb";
import PromotionCard from "@/models/PromotionCard";
import "@/models/AcademicBatch";

export const PROMOTION_CARDS_CACHE_TAG = "promotion-cards";

const visibleCardQuery = {
  isArchived: { $ne: true },
  websiteVisible: true,
};

const listLinkedBatchPopulate = {
  path: "linkedBatch" as const,
  select: "status totalSeats availableSeats classLevel genderGroup version",
};

const homeLinkedBatchPopulate = {
  path: "linkedBatch" as const,
  select: "status totalSeats availableSeats classLevel",
};

async function fetchVisiblePromotionCards() {
  await connectDB();

  return PromotionCard.find(visibleCardQuery)
    .populate(listLinkedBatchPopulate)
    .sort({ featured: -1, order: 1, createdAt: -1 })
    .lean();
}

async function fetchHomePromotionCards(limit: number) {
  await connectDB();

  return PromotionCard.find(visibleCardQuery)
    .populate(homeLinkedBatchPopulate)
    .sort({ featured: -1, order: 1, createdAt: -1 })
    .limit(limit)
    .lean();
}

async function fetchVisiblePromotionCardCount() {
  await connectDB();
  return PromotionCard.countDocuments(visibleCardQuery);
}

export const getVisiblePromotionCards = unstable_cache(
  fetchVisiblePromotionCards,
  ["visible-promotion-cards"],
  { revalidate: 60, tags: [PROMOTION_CARDS_CACHE_TAG] }
);

export const getHomePromotionCards = unstable_cache(
  () => fetchHomePromotionCards(6),
  ["home-promotion-cards"],
  { revalidate: 60, tags: [PROMOTION_CARDS_CACHE_TAG] }
);

export const getVisiblePromotionCardCount = unstable_cache(
  fetchVisiblePromotionCardCount,
  ["visible-promotion-card-count"],
  { revalidate: 60, tags: [PROMOTION_CARDS_CACHE_TAG] }
);

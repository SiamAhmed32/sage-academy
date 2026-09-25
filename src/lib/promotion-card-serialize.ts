type LinkedBatchDoc = {
  _id?: { toString(): string } | string;
  title?: string;
  batchCode?: string;
};

type PromotionCardDoc = {
  _id: { toString(): string };
  title?: string;
  image?: string;
  badge?: string;
  features?: string[];
  overview?: string;
  linkedBatch?: LinkedBatchDoc | string | null;
  academyBatch?: { _id?: { toString(): string } | string; code?: string } | string | null;
  websiteVisible?: boolean;
  featured?: boolean;
  order?: number;
  isArchived?: boolean;
};

export type SerializedPromotionCard = {
  _id: string;
  title: string;
  image: string;
  badge: string;
  features: string[];
  overview: string;
  linkedBatch?: {
    _id: string;
    title: string;
    batchCode: string;
  };
  websiteVisible: boolean;
  featured: boolean;
  order: number;
  isArchived: boolean;
};

const adminBadgeLabels: Record<string, string> = {
  "ভর্তি চলছে": "Enrollment open",
  "শীঘ্রই শুরু": "Starting soon",
  "ভর্তি বন্ধ": "Enrollment closed",
};

export function formatPromotionCardBadgeForAdmin(badge: string) {
  return adminBadgeLabels[badge] ?? badge;
}

function serializeLinkedBatch(
  linkedBatch: PromotionCardDoc["linkedBatch"]
): SerializedPromotionCard["linkedBatch"] | undefined {
  if (!linkedBatch || typeof linkedBatch !== "object") {
    return undefined;
  }

  const id =
    typeof linkedBatch._id === "string"
      ? linkedBatch._id
      : linkedBatch._id?.toString();

  if (!id) {
    return undefined;
  }

  return {
    _id: id,
    title: linkedBatch.title || "Unknown batch",
    batchCode: linkedBatch.batchCode || "N/A",
  };
}

export function serializePromotionCard(card: PromotionCardDoc): SerializedPromotionCard {
  return {
    _id: card._id.toString(),
    title: card.title || "Untitled card",
    image: card.image || "",
    badge: card.badge || "ভর্তি চলছে",
    features: Array.isArray(card.features) ? card.features.filter(Boolean) : [],
    overview: card.overview || "",
    // A new academy batch is sent as "academy:<id>" so the form's single batch select can hold both kinds.
    linkedBatch:
      card.academyBatch && typeof card.academyBatch === "object" && card.academyBatch._id
        ? { _id: `academy:${card.academyBatch._id.toString()}`, title: card.academyBatch.code || "Batch", batchCode: "New batch" }
        : serializeLinkedBatch(card.linkedBatch),
    websiteVisible: card.websiteVisible !== false,
    featured: Boolean(card.featured),
    order: Number(card.order) || 0,
    isArchived: Boolean(card.isArchived),
  };
}

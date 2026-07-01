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
    linkedBatch: serializeLinkedBatch(card.linkedBatch),
    websiteVisible: card.websiteVisible !== false,
    featured: Boolean(card.featured),
    order: Number(card.order) || 0,
    isArchived: Boolean(card.isArchived),
  };
}

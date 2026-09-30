import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BatchCardsCarousel, type HomeBatchCard } from "@/components/home/BatchCardsCarousel";
import { Container } from "@/components/shared/Container";
import { toBanglaDigits } from "@/constants/class-levels";
import { getHomePromotionCards, getVisiblePromotionCardCount } from "@/lib/promotion-cards";

type PromotionCardDoc = {
  _id: { toString(): string };
  title: string;
  image: string;
  features: string[];
  badge?: string;
  slug?: string;
  linkedBatch?:
    | {
        status?: string;
        classLevel?: number | string;
      }
    | null;
};

function serializeCard(card: PromotionCardDoc): HomeBatchCard {
  const linkedBatch =
    card.linkedBatch && typeof card.linkedBatch === "object"
      ? {
          status: card.linkedBatch.status,
          classLevel: card.linkedBatch.classLevel,
        }
      : null;

  return {
    id: card._id.toString(),
    title: card.title,
    image: card.image,
    features: Array.isArray(card.features) ? card.features : [],
    badge: card.badge,
    slug: card.slug,
    linkedBatch,
  };
}

export async function BatchSection() {
  let cards: PromotionCardDoc[] = [];
  let totalCount = 0;

  try {
    [cards, totalCount] = await Promise.all([
      getHomePromotionCards() as Promise<PromotionCardDoc[]>,
      getVisiblePromotionCardCount(),
    ]);
  } catch (error) {
    console.error("Home promotion cards fetch failed:", error);
  }

  if (!cards || cards.length === 0) return null;

  const serializedCards = cards.map(serializeCard);
  const batchCountLabel = totalCount > 0 ? ` (${toBanglaDigits(totalCount)}টি)` : "";

  return (
    <section className="bg-sage-white py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <p className="sage-eyebrow">
              শ্রেণিভিত্তিক ব্যাচ
            </p>
            <h2 className="sage-h2 mt-4">
              প্রতিটি শ্রেণির জন্য সাজানো একাডেমিক ব্যাচ
            </h2>
            <p className="sage-lead mt-4">
              নিয়মিত ক্লাস, সাপ্তাহিক মূল্যায়ন এবং অভিজ্ঞ শিক্ষকদের তত্ত্বাবধানে ক্লাস ৫ থেকে ১২ পর্যন্ত পরিকল্পিত লেকচার প্লান

            </p>
          </div>

          <Link
            href="/batches"
            className="sage-btn sage-btn-secondary sage-btn-sm w-full lg:mb-1 lg:w-auto lg:shrink-0"
          >
            সব ব্যাচ দেখুন{batchCountLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <BatchCardsCarousel cards={serializedCards} />
      </Container>
    </section>
  );
}

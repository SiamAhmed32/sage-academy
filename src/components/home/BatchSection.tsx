import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BatchCardsCarousel, type HomeBatchCard } from "@/components/home/BatchCardsCarousel";
import { Container } from "@/components/shared/Container";
import { toBanglaDigits } from "@/constants/class-levels";
import { connectDB } from "@/lib/mongodb";
import PromotionCard from "@/models/PromotionCard";
import "@/models/AcademicBatch";

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

async function getHomePromotionCards() {
  try {
    await connectDB();
    const cards = await PromotionCard.find({
      websiteVisible: true,
      featured: true,
    })
      .populate({
        path: "linkedBatch",
        select: "status totalSeats availableSeats classLevel",
      })
      .sort({ order: 1, createdAt: -1 })
      .limit(6)
      .lean<PromotionCardDoc[]>();

    return cards;
  } catch (error) {
    console.error("Home promotion cards fetch failed:", error);
    return [];
  }
}

async function getTotalVisibleBatchCount() {
  try {
    await connectDB();
    return PromotionCard.countDocuments({
      websiteVisible: true,
      isArchived: { $ne: true },
    });
  } catch {
    return 0;
  }
}

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
    features: card.features,
    badge: card.badge,
    slug: card.slug,
    linkedBatch,
  };
}

export async function BatchSection() {
  const [cards, totalCount] = await Promise.all([getHomePromotionCards(), getTotalVisibleBatchCount()]);

  if (!cards || cards.length === 0) return null;

  const serializedCards = cards.map(serializeCard);
  const batchCountLabel = totalCount > 0 ? ` (${toBanglaDigits(totalCount)}টি)` : "";

  return (
    <section className="bg-sage-white py-16 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full bg-sage-red-50 px-4 py-2 text-sm font-semibold text-sage-primary ring-1 ring-sage-red-100">
            শ্রেণিভিত্তিক ব্যাচ
          </p>
          <h2 className="mt-4 text-3xl font-bold text-sage-secondary sm:text-4xl">
            প্রতিটি শ্রেণির জন্য সাজানো একাডেমিক ব্যাচ
          </h2>
          <p className="mt-4 text-base leading-8 text-sage-gray-700">
            নিয়মিত ক্লাস, সাপ্তাহিক মূল্যায়ন এবং অভিজ্ঞ শিক্ষকদের তত্ত্বাবধানে
            ক্লাস ৫ থেকে ১২ পর্যন্ত পরিকল্পিত ব্যাচ।
          </p>
        </div>

        <Link
          href="/batches"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sage-primary px-6 py-4 text-base font-bold text-sage-white shadow-lg shadow-sage-primary/25 transition hover:bg-sage-secondary md:mt-8 md:w-auto"
        >
          সব ব্যাচ দেখুন{batchCountLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>

        <BatchCardsCarousel cards={serializedCards} />
      </Container>
    </section>
  );
}

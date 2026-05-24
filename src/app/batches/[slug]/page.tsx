export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";

import { BatchDetailsView } from "@/components/batches/BatchDetailsView";
import { batches } from "@/constants/batches";
import { connectDB } from "@/lib/mongodb";
import { buildPublicSlug } from "@/lib/public-slug";
import PromotionCard from "@/models/PromotionCard";
import type { BatchDetailsResponse } from "@/types/batch";

type AcademicBatchPageProps = {
  params: Promise<{ slug: string }>;
};

function buildStaticFallback(slug: string): {
  promotionCard: Record<string, unknown>;
  batch: BatchDetailsResponse["data"]["batch"];
  related: BatchDetailsResponse["data"]["related"];
} | null {
  const current = batches.find((item) => item.slug === slug);
  if (!current) return null;

  const related = batches
    .filter((item) => item.slug !== slug)
    .slice(0, 6)
    .map((item, idx) => ({
      _id: `static-${idx}-${item.slug}`,
      slug: item.slug,
      title: item.title,
      image: item.image,
      status: "ভর্তি চলছে",
      shift: item.shift ?? "",
    }));

  return {
    promotionCard: {
      _id: `static-card-${current.slug}`,
      title: current.title,
      slug: current.slug,
      image: current.image,
      badge: "ভর্তি চলছে",
      features: current.features,
      overview:
        "নিয়মিত ক্লাস, সাপ্তাহিক পরীক্ষা, প্রিন্টেড শিট এবং একাডেমিক মনিটরিংয়ের মাধ্যমে এই ব্যাচ সাজানো হয়েছে।",
    },
    batch: {
      _id: `static-${current.slug}`,
      slug: current.slug,
      title: current.title,
      image: current.image,
      shift: current.shift ?? "",
      features: current.features,
      status: "ভর্তি চলছে",
      isActive: true,
      order: 0,
      overview:
        "নিয়মিত ক্লাস, সাপ্তাহিক পরীক্ষা, প্রিন্টেড শিট এবং একাডেমিক মনিটরিংয়ের মাধ্যমে এই ব্যাচ সাজানো হয়েছে।",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      duration: "৩ মাস মেয়াদি প্রোগ্রাম",
      totalClasses: 36,
      seats: 30,
      instructor: null,
    },
    related,
  };
}

type PromotionCardLike = {
  _id: unknown;
  slug?: string;
  title?: string;
  image?: string;
  features?: string[];
  badge?: string;
  order?: number;
  overview?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

function buildCardOnlyBatch(promotionCard: PromotionCardLike) {
  return {
    _id: String(promotionCard._id),
    slug: promotionCard.slug,
    title: promotionCard.title,
    image: promotionCard.image,
    shift: "",
    features: promotionCard.features ?? [],
    status: promotionCard.badge || "ভর্তি চলছে",
    isActive: true,
    order: promotionCard.order ?? 0,
    overview: promotionCard.overview ?? "",
    createdAt: promotionCard.createdAt ?? new Date().toISOString(),
    updatedAt: promotionCard.updatedAt ?? new Date().toISOString(),
    subjects: [],
    totalSeats: 0,
    availableSeats: 0,
    version: "bangla",
  };
}

function getRequestedClassLevel(slug: string) {
  const match = slug.match(/^class-([4-9]|1[0-2])$/i);
  return match?.[1] ?? "";
}

async function findPromotionCard(slug: string) {
  const baseQuery = {
    isActive: { $ne: false },
    isArchived: { $ne: true },
    websiteVisible: true,
  };

  const exactCard = await PromotionCard.findOne({
    ...baseQuery,
    slug: slug.toLowerCase(),
  }).populate({
    path: "linkedBatch",
    populate: {
      path: "subjects.teacher",
      select: "name subject designation experience image quote socialLinks",
    },
  });

  if (exactCard) return exactCard;

  const requestedClassLevel = getRequestedClassLevel(slug);
  if (!requestedClassLevel) return null;

  const cards = await PromotionCard.find(baseQuery)
    .sort({ order: 1, createdAt: -1 })
    .populate({
      path: "linkedBatch",
      populate: {
        path: "subjects.teacher",
        select: "name subject designation experience image quote socialLinks",
      },
    });

  return (
    cards.find((card) => {
      const linkedClassLevel =
        typeof card.linkedBatch === "object" && card.linkedBatch
          ? card.linkedBatch.classLevel
          : "";

      return (
        buildPublicSlug({
          title: card.title,
          classLevel: linkedClassLevel,
          fallback: card.slug,
        }) === slug.toLowerCase()
      );
    }) ?? null
  );
}

export default async function AcademicBatchDetailsPage({ params }: AcademicBatchPageProps) {
  const { slug } = await params;

  await connectDB();

  const promotionCard = await findPromotionCard(slug);

  if (promotionCard) {
    const linkedClassLevel =
      typeof promotionCard.linkedBatch === "object" && promotionCard.linkedBatch
        ? promotionCard.linkedBatch.classLevel
        : "";
    const canonicalSlug = buildPublicSlug({
      title: promotionCard.title,
      classLevel: linkedClassLevel,
      fallback: promotionCard.slug,
    });

    if (canonicalSlug && canonicalSlug !== slug.toLowerCase()) {
      redirect(`/batches/${canonicalSlug}`);
    }
  }

  if (promotionCard && promotionCard.linkedBatch) {
    const batch = promotionCard.linkedBatch;
    
    const related = await PromotionCard.find({
      _id: { $ne: promotionCard._id },
      websiteVisible: true,
      featured: true,
    })
      .sort({ order: 1, createdAt: 1 })
      .limit(6)
      .select("title slug image badge");

    const serialized = JSON.parse(
      JSON.stringify({
        promotionCard,
        batch,
        related,
      })
    );

    return <BatchDetailsView data={serialized} />;
  }

  if (promotionCard) {
    const related = await PromotionCard.find({
      _id: { $ne: promotionCard._id },
      websiteVisible: true,
      featured: true,
    })
      .sort({ order: 1, createdAt: 1 })
      .limit(6)
      .select("title slug image badge");

    const serialized = JSON.parse(
      JSON.stringify({
        promotionCard,
        batch: buildCardOnlyBatch(promotionCard),
        related,
      })
    );

    return <BatchDetailsView data={serialized} />;
  }

  const fallback = buildStaticFallback(slug);
  if (!fallback) {
    notFound();
  }

  return <BatchDetailsView data={fallback} />;
}

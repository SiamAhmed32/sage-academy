import { Metadata } from "next";
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";

import { BatchDetailsView } from "@/components/batches/BatchDetailsView";
import { batches } from "@/constants/batches";
import { connectDB } from "@/lib/mongodb";
import PromotionCard from "@/models/PromotionCard";
import AcademicBatch from "@/models/AcademicBatch";
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

export default async function AcademicBatchDetailsPage({ params }: AcademicBatchPageProps) {
  const { slug } = await params;

  await connectDB();

  // 1. Find the promotion card by slug
  const promotionCard = await PromotionCard.findOne({
    slug: slug.toLowerCase(),
    isActive: { $ne: false },
    isArchived: { $ne: true },
    websiteVisible: true,
  }).populate({
    path: "linkedBatch",
    populate: {
      path: "subjects.teacher",
      select: "name subject designation experience image quote socialLinks"
    }
  });

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

  const fallback = buildStaticFallback(slug);
  if (!fallback) {
    notFound();
  }

  return <BatchDetailsView data={fallback} />;
}

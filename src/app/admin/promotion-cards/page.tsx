import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PromotionCardCreateButton } from "@/components/admin/promotion-cards/PromotionCardCreateButton";
import { PromotionCardTable } from "@/components/admin/promotion-cards/PromotionCardTable";
import { connectDB } from "@/lib/mongodb";
import { serializePromotionCard } from "@/lib/promotion-card-serialize";
import AcademicBatch from "@/models/AcademicBatch";
import PromotionCard from "@/models/PromotionCard";

export default async function PromotionCardsPage() {
  await connectDB();

  const [cards, academicBatches] = await Promise.all([
    PromotionCard.find({})
      .sort({ order: 1, createdAt: -1 })
      .populate("linkedBatch", "title batchCode")
      .lean(),
    AcademicBatch.find({ isArchived: { $ne: true } })
      .select("title batchCode")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const batchOptions = academicBatches.map((batch) => ({
    _id: batch._id.toString(),
    title: batch.title,
    batchCode: batch.batchCode,
  }));

  const serializedCards = cards.map((card) => serializePromotionCard(card));

  return (
    <div>
      <AdminPageHeader
        title="প্রমোশন কার্ড ম্যানেজমেন্ট"
        description="ওয়েবসাইটের হোমপেজে যে কার্ডগুলো দেখাবে, সেগুলো এখান থেকে তৈরি ও সাজান।"
        action={<PromotionCardCreateButton batches={batchOptions} />}
      />

      <PromotionCardTable cards={serializedCards} batches={batchOptions} />
    </div>
  );
}

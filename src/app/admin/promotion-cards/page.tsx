import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import PromotionCard from "@/models/PromotionCard";
import AcademicBatch from "@/models/AcademicBatch";
import { PromotionCardCreateButton } from "@/components/admin/promotion-cards/PromotionCardCreateButton";
import { PromotionCardTable } from "@/components/admin/promotion-cards/PromotionCardTable";

export default async function PromotionCardsPage() {
  await connectDB();
  
  const [cards, academicBatches] = await Promise.all([
    PromotionCard.find({}).sort({ order: 1, createdAt: -1 }).populate("linkedBatch").lean(),
    AcademicBatch.find({ isArchived: { $ne: true } }).select("title batchCode").sort({ createdAt: -1 }).lean(),
  ]);

  const batchOptions = academicBatches.map(b => ({
    _id: b._id.toString(),
    title: b.title,
    batchCode: b.batchCode
  }));

  return (
    <div>
      <AdminPageHeader
        title="প্রমোশন কার্ড ম্যানেজমেন্ট"
        description="ওয়েবসাইটের হোমপেজে যে কার্ডগুলো দেখাবে, সেগুলো এখান থেকে তৈরি ও সাজান।"
        action={<PromotionCardCreateButton batches={batchOptions} />}
      />

      <PromotionCardTable 
        cards={JSON.parse(JSON.stringify(cards))} 
        batches={batchOptions}
      />
    </div>
  );
}

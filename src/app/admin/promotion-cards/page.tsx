import { PromotionCardCreateButton, PromotionCardsGrid, type PromotionBatchOption } from "@/components/admin/grids/PromotionCardsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { promotionCardTiles } from "@/lib/grid/tiles-content";
import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";
import AcademyBatch from "@/models/academy/AcademyBatch";

async function promotionBatchOptions(): Promise<PromotionBatchOption[]> {
  await connectDB();
  const [academicBatches, academyBatches] = await Promise.all([
    AcademicBatch.find({ isArchived: { $ne: true } })
      .select("title batchCode")
      .sort({ createdAt: -1 })
      .lean<{ _id: unknown; title: string; batchCode: string }[]>(),
    AcademyBatch.find({ status: "active" }).select("code classLevel").sort({ classLevel: 1, code: 1 }).lean<{ _id: unknown; code: string; classLevel: number }[]>(),
  ]);

  // New academy batches first; old website batches stay selectable for existing cards.
  return [
    ...academyBatches.map((batch) => ({
      _id: `academy:${String(batch._id)}`,
      title: `Class ${batch.classLevel}`,
      batchCode: batch.code,
      group: "new" as const,
    })),
    ...academicBatches.map((batch) => ({
      _id: String(batch._id),
      title: batch.title,
      batchCode: batch.batchCode,
      group: "old" as const,
    })),
  ];
}

export default async function PromotionCardsPage() {
  const [tiles, batches] = await Promise.all([promotionCardTiles(), promotionBatchOptions()]);

  return (
    <div>
      <PageHeading
        title="Promotion Cards"
        description="Create and arrange the cards displayed on the website homepage."
        actions={<PromotionCardCreateButton batches={batches} />}
      />
      <PromotionCardsGrid tiles={tiles} batches={batches} />
    </div>
  );
}

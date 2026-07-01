import AcademicBatch from "@/models/AcademicBatch";
import { buildBatchSlug } from "@/lib/batch-code";

/** Backfill slug for legacy batch rows created before slug was required. */
export async function backfillMissingBatchSlugs() {
  const legacyBatches = await AcademicBatch.find({
    $or: [{ slug: null }, { slug: { $exists: false } }, { slug: "" }],
    batchCode: { $exists: true, $ne: "" },
  })
    .select("_id batchCode")
    .lean();

  for (const batch of legacyBatches) {
    const slug = buildBatchSlug(String(batch.batchCode));
    await AcademicBatch.updateOne({ _id: batch._id }, { $set: { slug } });
  }
}

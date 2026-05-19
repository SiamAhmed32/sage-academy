import { getBatchAudienceLabel } from "@/lib/batch-code";

type BatchDocLike = {
  _id?: unknown;
  title: string;
  slug: string;
  batchCode?: string;
  image?: string;
  classLevel?: number;
  genderGroup?: string;
  version?: string;
  feature1?: string;
  feature2?: string;
  feature3?: string;
  feature4?: string;
  features?: string[];
  status?: string;
  order?: number;
};

export function toPublicBatch(batch: BatchDocLike) {
  const features = [
    batch.feature1,
    batch.feature2,
    batch.feature3,
    batch.feature4,
  ].filter(Boolean) as string[];

  return {
    _id: String(batch._id ?? batch.slug),
    title: batch.title,
    slug: batch.slug,
    batchCode: batch.batchCode ?? "",
    image: batch.image || "/BatchImages/Class6NewBatch.jpeg",
    shift: getBatchAudienceLabel(batch.genderGroup || "male", batch.version || "bangla"),
    classLevel: batch.classLevel,
    genderGroup: batch.genderGroup,
    version: batch.version,
    features: features.length === 4 ? features : batch.features ?? [],
    status: batch.status || "ভর্তি চলছে",
    order: batch.order ?? 0,
  };
}

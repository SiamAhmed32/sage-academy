import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PromotionCardCreateButton } from "@/components/admin/promotion-cards/PromotionCardCreateButton";
import { PromotionCardTable } from "@/components/admin/promotion-cards/PromotionCardTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import {
  boundedAdminSearch,
  clampAdminPage,
  escapeAdminRegex,
  getAdminParam,
  parseAdminPage,
  pickAdminSort,
} from "@/lib/admin-query";
import { connectDB } from "@/lib/mongodb";
import { serializePromotionCard } from "@/lib/promotion-card-serialize";
import AcademicBatch from "@/models/AcademicBatch";
import PromotionCard from "@/models/PromotionCard";
import { isValidObjectId } from "mongoose";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 20;
const sortOptions: Record<string, Record<string, 1 | -1>> = {
  order: { order: 1, createdAt: -1 },
  newest: { createdAt: -1 },
  title: { title: 1, createdAt: -1 },
};

export default async function PromotionCardsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = boundedAdminSearch(getAdminParam(params, "q"));
  const batch = getAdminParam(params, "batch");
  const visibility = getAdminParam(params, "visibility");
  const view = getAdminParam(params, "view") === "archived" ? "archived" : "active";
  const sort = getAdminParam(params, "sort", "order");
  const requestedPage = parseAdminPage(getAdminParam(params, "page"));
  const filter: Record<string, unknown> = {
    isArchived: view === "archived" ? true : { $ne: true },
  };

  if (q) filter.title = new RegExp(escapeAdminRegex(q), "i");
  if (batch === "none") filter.linkedBatch = null;
  else if (isValidObjectId(batch)) filter.linkedBatch = batch;
  if (visibility === "visible") filter.websiteVisible = true;
  if (visibility === "hidden") filter.websiteVisible = false;
  if (visibility === "featured") filter.featured = true;

  await connectDB();

  const [total, academicBatches] = await Promise.all([
    PromotionCard.countDocuments(filter),
    AcademicBatch.find({ isArchived: { $ne: true } })
      .select("title batchCode")
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const { page, totalPages } = clampAdminPage(requestedPage, total, PAGE_SIZE);
  const cards = await PromotionCard.find(filter)
      .sort(pickAdminSort(sort, sortOptions, "order"))
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate("linkedBatch", "title batchCode")
      .lean();

  const batchOptions = academicBatches.map((batch) => ({
    _id: batch._id.toString(),
    title: batch.title,
    batchCode: batch.batchCode,
  }));

  const serializedCards = cards.map((card) => serializePromotionCard(card));

  return (
    <div>
      <AdminPageHeader
        title="Promotion Cards"
        description="Create and arrange the cards displayed on the website homepage."
        action={<PromotionCardCreateButton batches={batchOptions} />}
      />

      <PromotionCardTable
        cards={serializedCards}
        batches={batchOptions}
        filters={{ q, batch, visibility, view, sort }}
      />
      <Pagination totalPages={totalPages} currentPage={page} totalItems={total} pageSize={PAGE_SIZE} showWhenSinglePage />
    </div>
  );
}

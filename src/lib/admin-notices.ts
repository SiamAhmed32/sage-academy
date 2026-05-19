import Notice from "@/models/Notice";
import { normalizeObjectId } from "@/lib/object-id";

const PAGE_SIZE = 15;

export type AdminNoticeQuery = {
  q?: string;
  type?: string;
  classLevel?: string;
  batch?: string;
  status?: string;
  page?: string;
};

export async function fetchAdminNotices(params: AdminNoticeQuery) {
  const page = Math.max(1, Number(params.page) || 1);
  const filter: Record<string, unknown> = {};

  if (params.type) filter.type = params.type;
  if (params.classLevel) filter.classLevel = Number(params.classLevel);
  if (params.batch) {
    const batchId = normalizeObjectId(params.batch);
    if (batchId) filter.batch = batchId;
  }
  if (params.status === "published") filter.isPublished = true;
  if (params.status === "draft") filter.isPublished = false;

  if (params.q?.trim()) {
    const q = params.q.trim();
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { topic: { $regex: q, $options: "i" } },
      { details: { $regex: q, $options: "i" } },
    ];
  }

  const [total, notices] = await Promise.all([
    Notice.countDocuments(filter),
    Notice.find(filter)
      .populate("batch", "title batchCode classLevel")
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
  ]);

  return {
    notices: JSON.parse(JSON.stringify(notices)),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

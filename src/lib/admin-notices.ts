import Notice from "@/models/Notice";
import { normalizeObjectId } from "@/lib/object-id";

const PAGE_SIZE = 15;
const MAX_SEARCH_LENGTH = 80;
const NOTICE_TYPES = new Set(["general", "class", "batch", "exam", "payment"]);

export type AdminNoticeQuery = {
  q?: string;
  type?: string;
  classLevel?: string;
  batch?: string;
  status?: string;
  page?: string;
};

export async function fetchAdminNotices(params: AdminNoticeQuery) {
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const filter: Record<string, unknown> = {};

  if (params.type && NOTICE_TYPES.has(params.type)) filter.type = params.type;
  const classLevel = Number(params.classLevel);
  if (Number.isInteger(classLevel) && classLevel >= 1 && classLevel <= 12) {
    filter.classLevel = classLevel;
  }
  if (params.batch) {
    const batchId = normalizeObjectId(params.batch);
    if (batchId) filter.batch = batchId;
  }
  if (params.status === "published") filter.isPublished = true;
  if (params.status === "draft") filter.isPublished = false;

  if (params.q?.trim()) {
    const q = params.q.trim().slice(0, MAX_SEARCH_LENGTH);
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: safe, $options: "i" } },
      { topic: { $regex: safe, $options: "i" } },
      { details: { $regex: safe, $options: "i" } },
    ];
  }

  const total = await Notice.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    totalPages
  );
  const notices = await Notice.find(filter)
    .populate("batch", "title batchCode classLevel")
    .sort({ publishedAt: -1, createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  return {
    notices: JSON.parse(JSON.stringify(notices)),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
  };
}

import { z } from "zod";

const SEARCH_MAX_LENGTH = 100;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

const searchSchema = z
  .string()
  .trim()
  .max(SEARCH_MAX_LENGTH, `Search terms must be ${SEARCH_MAX_LENGTH} characters or fewer`)
  .default("");

const pageSchema = z.coerce.number().int().min(1, "Page must be at least 1").default(1);
const limitSchema = z.coerce
  .number()
  .int()
  .min(1, "Limit must be at least 1")
  .max(MAX_PAGE_SIZE, `Limit cannot exceed ${MAX_PAGE_SIZE}`)
  .default(DEFAULT_PAGE_SIZE);

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Program ID must be a valid MongoDB ObjectId")
  .optional();

const programQuerySchema = z.object({
  q: searchSchema,
  deliveryMode: z.enum(["online", "offline"]).optional(),
  status: z.enum(["draft", "published", "hidden", "archived"]).optional(),
  accessType: z.enum(["public", "private"]).optional(),
  offlineType: z.enum(["weekly", "monthly"]).optional(),
  sort: z
    .enum([
      "order:asc",
      "order:desc",
      "createdAt:asc",
      "createdAt:desc",
      "title:asc",
      "title:desc",
      "startDate:asc",
      "startDate:desc",
    ])
    .default("order:asc"),
  page: pageSchema,
  limit: limitSchema,
});

const enrollmentQuerySchema = z.object({
  q: searchSchema,
  status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
  paymentStatus: z
    .enum(["not_required", "pending", "submitted", "verified", "rejected"])
    .optional(),
  programId: objectIdSchema,
  sort: z
    .enum(["createdAt:asc", "createdAt:desc", "name:asc", "name:desc"])
    .default("createdAt:desc"),
  page: pageSchema,
  limit: limitSchema,
});

const attemptQuerySchema = z.object({
  q: searchSchema,
  status: z.enum(["in_progress", "submitted", "expired"]).optional(),
  programId: objectIdSchema,
  sort: z
    .enum([
      "submittedAt:asc",
      "submittedAt:desc",
      "createdAt:asc",
      "createdAt:desc",
      "score:asc",
      "score:desc",
      "name:asc",
      "name:desc",
    ])
    .default("submittedAt:desc"),
  page: pageSchema,
  limit: limitSchema,
});

type SortDirection = 1 | -1;
type MongoSort = Record<string, SortDirection>;

const programSorts: Record<z.infer<typeof programQuerySchema>["sort"], MongoSort> = {
  "order:asc": { order: 1, createdAt: -1, _id: -1 },
  "order:desc": { order: -1, createdAt: -1, _id: -1 },
  "createdAt:asc": { createdAt: 1, _id: 1 },
  "createdAt:desc": { createdAt: -1, _id: -1 },
  "title:asc": { title: 1, _id: 1 },
  "title:desc": { title: -1, _id: -1 },
  "startDate:asc": { startDate: 1, _id: 1 },
  "startDate:desc": { startDate: -1, _id: -1 },
};

const enrollmentSorts: Record<z.infer<typeof enrollmentQuerySchema>["sort"], MongoSort> = {
  "createdAt:asc": { createdAt: 1, _id: 1 },
  "createdAt:desc": { createdAt: -1, _id: -1 },
  "name:asc": { name: 1, _id: 1 },
  "name:desc": { name: -1, _id: -1 },
};

const attemptSorts: Record<z.infer<typeof attemptQuerySchema>["sort"], MongoSort> = {
  "submittedAt:asc": { submittedAt: 1, createdAt: 1, _id: 1 },
  "submittedAt:desc": { submittedAt: -1, createdAt: -1, _id: -1 },
  "createdAt:asc": { createdAt: 1, _id: 1 },
  "createdAt:desc": { createdAt: -1, _id: -1 },
  "score:asc": { score: 1, submittedAt: -1, _id: -1 },
  "score:desc": { score: -1, submittedAt: -1, _id: -1 },
  "name:asc": { name: 1, _id: 1 },
  "name:desc": { name: -1, _id: -1 },
};

function readQuery(searchParams: URLSearchParams, keys: string[]) {
  return Object.fromEntries(
    keys.flatMap((key) => {
      const value = searchParams.get(key);
      return value == null || value === "" || value === "all" ? [] : [[key, value]];
    })
  );
}

export function escapeExamHubRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseExamProgramListQuery(searchParams: URLSearchParams) {
  const parsed = programQuerySchema.parse(
    readQuery(searchParams, [
      "q",
      "deliveryMode",
      "status",
      "accessType",
      "offlineType",
      "sort",
      "page",
      "limit",
    ])
  );

  const filter: Record<string, unknown> = {};
  if (parsed.q) {
    const regex = { $regex: escapeExamHubRegex(parsed.q), $options: "i" };
    filter.$or = [{ title: regex }, { slug: regex }, { subtitle: regex }];
  }
  if (parsed.deliveryMode) filter.deliveryMode = parsed.deliveryMode;
  if (parsed.status) filter.status = parsed.status;
  if (parsed.accessType) filter.accessType = parsed.accessType;
  if (parsed.offlineType) filter.offlineType = parsed.offlineType;

  return { ...parsed, filter, mongoSort: programSorts[parsed.sort] };
}

export function parseExamEnrollmentListQuery(searchParams: URLSearchParams) {
  const parsed = enrollmentQuerySchema.parse(
    readQuery(searchParams, ["q", "status", "paymentStatus", "programId", "sort", "page", "limit"])
  );

  const filter: Record<string, unknown> = {};
  if (parsed.q) {
    const regex = { $regex: escapeExamHubRegex(parsed.q), $options: "i" };
    filter.$or = [
      { name: regex },
      { phone: regex },
      { email: regex },
      { classLabel: regex },
      { transactionId: regex },
    ];
  }
  if (parsed.status) filter.status = parsed.status;
  if (parsed.paymentStatus) filter.paymentStatus = parsed.paymentStatus;
  if (parsed.programId) filter.programId = parsed.programId;

  return { ...parsed, filter, mongoSort: enrollmentSorts[parsed.sort] };
}

export function parseExamAttemptListQuery(searchParams: URLSearchParams) {
  const parsed = attemptQuerySchema.parse(
    readQuery(searchParams, ["q", "status", "programId", "sort", "page", "limit"])
  );

  const filter: Record<string, unknown> = {};
  if (parsed.q) {
    const regex = { $regex: escapeExamHubRegex(parsed.q), $options: "i" };
    filter.$or = [{ name: regex }, { phone: regex }, { ip: regex }];
  }
  if (parsed.status) filter.status = parsed.status;
  if (parsed.programId) filter.programId = parsed.programId;

  return { ...parsed, filter, mongoSort: attemptSorts[parsed.sort] };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

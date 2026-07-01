import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { throwValidation } from "@/app/api/batches/shared";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { batchPayloadFromFormData } from "@/lib/batch-request";
import { backfillMissingBatchSlugs } from "@/lib/batch-slug";
import { withBatchSlug } from "@/lib/batch-code";
import { ConflictError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import AcademicBatch from "@/models/AcademicBatch";
import { createAcademicBatchSchema } from "@/schemas/academic-batch";

export const GET = withApiHandler(async (req: NextRequest) => {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const shift = (searchParams.get("shift") ?? "").trim();
  const websiteVisible = searchParams.get("websiteVisible");
  const featured = searchParams.get("featured");
  const status = (searchParams.get("status") ?? "").trim().toLowerCase();
  const classLevel = (searchParams.get("classLevel") ?? "").trim();
  const genderGroup = (searchParams.get("genderGroup") ?? "").trim().toLowerCase();
  const archive = (searchParams.get("archive") ?? "exclude").trim().toLowerCase();
  const sort = (searchParams.get("sort") ?? "order").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(24, Math.max(1, Number(searchParams.get("limit") ?? 9)));
  const includeInactive = searchParams.get("includeInactive") === "true";

  const query: {
    isActive?: boolean;
    isArchived?: boolean | { $ne: boolean };
    classLevel?: number;
    genderGroup?: "male" | "female";
    $or?: Array<Record<string, { $regex: string; $options: string }>>;
    shift?: { $regex: string; $options: string };
    status?: { $regex: string; $options: string };
    websiteVisible?: boolean;
    featured?: boolean;
  } = {};

  if (!includeInactive) {
    query.isActive = true;
  }
  if (archive === "only" || status === "archived") {
    query.isArchived = true;
  } else if (archive !== "include") {
    query.isArchived = { $ne: true };
  }

  if (classLevel && Number.isFinite(Number(classLevel))) {
    query.classLevel = Number(classLevel);
  }
  if (["male", "female"].includes(genderGroup)) {
    query.genderGroup = genderGroup as "male" | "female";
  }

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { slug: { $regex: q, $options: "i" } },
      { batchCode: { $regex: q, $options: "i" } },
      { shift: { $regex: q, $options: "i" } },
      { features: { $regex: q, $options: "i" } },
      { status: { $regex: q, $options: "i" } },
    ];
  }

  if (shift) {
    query.shift = { $regex: shift, $options: "i" };
  }

  if (status && status !== "archived") {
    query.status = { $regex: status, $options: "i" };
  }
  if (websiteVisible === "true") query.websiteVisible = true;
  if (featured === "true") query.featured = true;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    order: { order: 1, createdAt: 1 },
    newest: { createdAt: -1 },
    title: { title: 1 },
  };
  const sortQuery = sortMap[sort] ?? sortMap.order;

  const [items, total] = await Promise.all([
    AcademicBatch.find(query)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit),
    AcademicBatch.countDocuments(query),
  ]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return successResponse(
    {
      items,
      meta: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
        filters: { q, shift, status, sort, classLevel, genderGroup, archive },
      },
    },
    "AcademicBatches fetched successfully"
  );
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const contentType = req.headers.get("content-type") ?? "";
  let body: unknown = {};

  if (contentType.includes("multipart/form-data")) {
    body = await batchPayloadFromFormData(await req.formData());
  } else {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  let validatedData;
  try {
    validatedData = createAcademicBatchSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwValidation(error);
    throw error;
  }

  // Check for duplicate batch code
  const existing = await AcademicBatch.findOne({ batchCode: validatedData.batchCode });
  if (existing) {
    throw new ConflictError(`এই শ্রেণির (${validatedData.batchCode}) জন্য ব্যাচটি ইতিমধ্যে তৈরি করা হয়েছে।`);
  }

  await backfillMissingBatchSlugs();

  const batch = await AcademicBatch.create(withBatchSlug(validatedData));

  return successResponse(batch, "AcademicBatch created successfully", 201);
});

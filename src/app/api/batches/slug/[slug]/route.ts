import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withApiHandler(async (_req: NextRequest, context: RouteContext) => {
  const { slug } = await context.params;
  const normalizedSlug = (slug ?? "").trim().toLowerCase();

  await connectDB();

  const batch = await AcademicBatch.findOne({
    slug: normalizedSlug,
    isActive: true,
    isArchived: { $ne: true },
    websiteVisible: true,
  }).populate("subjects.teacher", "name subject designation experience image quote");

  if (!batch) {
    throw new NotFoundError("AcademicBatch not found");
  }

  const related = await AcademicBatch.find({
    _id: { $ne: batch._id },
    isActive: true,
    isArchived: { $ne: true },
    websiteVisible: true,
  })
    .sort({ order: 1, createdAt: 1 })
    .limit(6)
    .select("title slug image status shift");

  return successResponse(
    {
      batch,
      related,
    },
    "AcademicBatch details fetched successfully"
  );
});

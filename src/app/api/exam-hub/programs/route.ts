import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { serializePublicProgram } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";

export const GET = withApiHandler(async (req: NextRequest) => {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const deliveryMode = searchParams.get("deliveryMode");
  const offlineType = searchParams.get("offlineType");
  const accessType = searchParams.get("accessType");

  const filter: Record<string, unknown> = { status: "published" };
  if (deliveryMode === "online" || deliveryMode === "offline") filter.deliveryMode = deliveryMode;
  if (offlineType === "weekly" || offlineType === "monthly") filter.offlineType = offlineType;
  if (accessType === "public" || accessType === "private") filter.accessType = accessType;

  const items = await ExamProgram.find(filter).sort({ featured: -1, order: 1, startDate: 1 }).lean();
  return successResponse(
    items.map((item) => serializePublicProgram(item as Record<string, unknown>)),
    "Programs fetched"
  );
});

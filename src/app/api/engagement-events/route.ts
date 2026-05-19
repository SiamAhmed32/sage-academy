import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";
import { getEngagementAnalytics } from "@/lib/engagement-analytics-server";
import { connectDB } from "@/lib/mongodb";
import { staffRoles, requireRole } from "@/lib/rbac";
import EngagementEvent from "@/models/EngagementEvent";
import { createEngagementEventSchema } from "@/schemas/engagement-event";

export const POST = withApiHandler(async (req: NextRequest) => {
  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let validated;
  try {
    validated = createEngagementEventSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error.issues[0]?.message ?? "Invalid payload");
    }
    throw error;
  }

  const doc = await EngagementEvent.create({
    eventType: validated.eventType,
    sessionId: validated.sessionId,
    path: validated.path,
    label: validated.label,
    referrer: validated.referrer,
    contactEmail: validated.contactEmail,
    contactPhone: validated.contactPhone,
  });

  return successResponse({ id: doc._id.toString() }, "Recorded", 201);
});

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(staffRoles);
  await connectDB();

  const daysParam = req.nextUrl.searchParams.get("days");
  const days = Math.min(90, Math.max(1, Number(daysParam) || 14));

  const analytics = await getEngagementAnalytics(days);

  return successResponse(analytics, "Engagement analytics loaded");
});

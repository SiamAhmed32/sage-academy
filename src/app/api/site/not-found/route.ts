import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { connectDB } from "@/lib/mongodb";
import { assertRateLimit, buildRateLimitKey } from "@/lib/rate-limit";
import NotFoundHit from "@/models/NotFoundHit";
import { notFoundHitSchema } from "@/schemas/not-found-hit";

export const POST = withApiHandler(async (req: NextRequest) => {
  assertRateLimit(buildRateLimitKey("site:not-found-hit", req), 20, 15 * 60_000);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let payload;
  try {
    payload = notFoundHitSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return new NextResponse(null, { status: 204 });
    }
    throw error;
  }

  await connectDB();
  await NotFoundHit.create({
    path: payload.path,
    referrer: payload.referrer.slice(0, 600),
  });

  return new NextResponse(null, { status: 204 });
});

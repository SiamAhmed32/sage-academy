import { NextRequest, NextResponse } from "next/server";

import { ensureAllBillingMonthsForActiveStudents } from "@/lib/billing";
import { connectDB } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const result = await ensureAllBillingMonthsForActiveStudents();

  return NextResponse.json({
    ok: true,
    ...result,
    ranAt: new Date().toISOString(),
  });
}

import { NextRequest, NextResponse } from "next/server";

import { ensureMonthlyDues } from "@/lib/academy/dues";
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

  // New academy workflow: create this month's tuition dues (idempotent).
  let academy: { month: string; created: number } | { error: string };
  try {
    academy = await ensureMonthlyDues();
  } catch (error) {
    console.error("[cron] academy dues failed", error);
    academy = { error: "failed" };
  }

  return NextResponse.json({
    ok: true,
    ...result,
    academy,
    ranAt: new Date().toISOString(),
  });
}

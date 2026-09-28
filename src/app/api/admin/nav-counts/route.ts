import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { connectDB } from "@/lib/mongodb";
import { staffRoles, requireRole } from "@/lib/rbac";
import AdmissionRequest from "@/models/AdmissionRequest";

export const dynamic = "force-dynamic";

const admissionBadgeCount = unstable_cache(
  async () => {
    await connectDB();
    return AdmissionRequest.countDocuments({ status: "new", isArchived: { $ne: true } });
  },
  ["admin-admission-badge"],
  { revalidate: 30 }
);

export async function GET() {
  await requireRole(staffRoles);
  try {
    const admissionRequests = await admissionBadgeCount();
    return NextResponse.json({ admissionRequests });
  } catch {
    return NextResponse.json({ admissionRequests: 0 });
  }
}

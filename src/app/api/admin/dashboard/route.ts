import { NextResponse } from "next/server";

import { getAdminHome } from "@/lib/admin/home";
import { AppError } from "@/lib/errors";
import { requireRole, staffRoles } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole(staffRoles);
    const home = await getAdminHome();
    return NextResponse.json({ name: user.name, ...home });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    console.error("[admin-dashboard]", error);
    return NextResponse.json({ message: "Could not load the dashboard." }, { status: 500 });
  }
}
